import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

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
    if (!email || !username) {
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

    const loggedInUser = awaitUser.findById(user._id).select("-password -refreshToken")

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

export { registerUser, loginUser, logoutUser }