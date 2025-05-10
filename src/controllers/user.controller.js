import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        // console.log(user);
        const accessToken = user.generateAccessToken()
        console.log("error1 : " ,  accessToken);
        const refreshToken = user.generateRefreshAccessToken()
        console.log("error2:", refreshToken);

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend

    const { fullName, username, email, password } = req.body
    // console.log(fullName, username, email, password);

    // validation - not empty 

    // if(fullName == ""){
    //     throw new ApiError(400, "Full name is required")
    // }
    if (
        [fullName, username, email, password].some((field) => field?.trim() == "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // check if user already exists : username , email

    const existedUser = await User.findOne({
        //checks for multiple values at once
        $or: [
            { username },
            { email }
        ]
    })
    if (existedUser) {
        throw new ApiError(409, "User already exists")
    }

    // check for images and avatar

    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }
    // upload them to cloudinary
    // console.log(avatarLocalPath, coverImageLocalPath);

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed")
    }

    // create user object - create entry in db

    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    })

    // check for user creation

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    // remove password and refresh token field from response

    if (!createdUser) {
        throw new ApiError(500, "User creation failed")
    }

    // return response 

    return res.status(201).json(new ApiResponse(201, createdUser, "User Created Successfully"))


})

const loginUser = asyncHandler(async (req, res) => {
    //req.body -> data sent from frontend
    const { username, email, password } = req.body
    //username or email
    if (!email && !username) {
        throw new ApiError(400, "Email or username is required")
    }

    //find the user
    const user = await User.findOne({
        $or: [
            { email },
            { username }
        ]
    })

    //check if the user exists or not
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    //password check
    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid user credentials")
    }
    //access token and refreshtoken

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    //send cookies

    const options ={
        httpOnly : true,
        secure : true,
    }

    //send response

    return res.status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken",refreshToken, options)
    .json(new ApiResponse(200, {user : loggedInUser, accessToken,refreshToken}, "User logged in successfully"))

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
        {
        $set : {
            refreshToken : null
        },
    },
        {
            new : true
        }
    )
    const options ={
        httpOnly : true,
        secure : true,
    }
    return res.status(200)
    .cookie("accessToken", "", options)
    .cookie("refreshToken", "", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
   try {
     const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
 
     if(!incomingRefreshToken){
         throw new ApiError(401, "Refresh token is required")
     }
 
     const decodedToken =  jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
 
     if(!decodedToken){
         throw new ApiError(401, "Invalid refresh token")
     }
 
     const user = await User.findById(decodedToken._id)
 
     if(!user){
         throw new ApiError(401, "User not found andd token invalid")
     }
 
     if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401, "Invalid refresh token")
     }
 
     const options= {
         httpOnly : true,
         secure : true
     }
 
     const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)
 
     return res.status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", refreshToken, options)
     .json(new ApiResponse(200, { accessToken, newRefreshToken }, "Access token refreshed successfully"))
   } catch (error) {
     throw new ApiError(401, "Unauthorized")
   }

})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const { oldPassword,newPassword } = req.body
    const user = await User.findById(req.user._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))

})

const currentUser = asyncHandler(async (req, res) => {
    const user = req.user
    return res.status(200).json(new ApiResponse(200 , user , "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body
    
    if(!fullName || !email) {
        throw new ApiError(400, "Full name and email are required")
    }

   const user =  User.findByIdAndUpdate(req.user._id, {
        $set:{
            fullName,
            email
        }
    } ,{new:true}).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200, user, "User details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }
    // upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(400, "Avatar upload failed error")
    }
    // update user avatar in db
    const user = await User.findByIdAndUpdate(req.user._id, {
        $set: {
            avatar : avatar.url
        }
    }, { new: true }).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverimage is required")
    }
    // upload it to cloudinary
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(400, "Cover Image upload failed error")
    }
    // update user cover image in db
    const user = await User.findByIdAndUpdate(req.user._id, {
        $set: {
            coverImage : coverImage.url
        }
    }, { new: true }).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200, user, "coverImage updated successfully"))
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, currentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage }