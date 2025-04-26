import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend

    const { fullName, username, email, password } = req.body
    console.log(fullName, username, email, password);

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

    const existedUser = User.findOne({
        //checks for multiple values at once
        $or: [
            { username },
            { email }
        ]
    })
    if(existedUser){
        throw new ApiError(409, "User already exists")
    }

    // check for images and avatar
    
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }
    // upload them to cloudinary
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if(!avatar){
        throw new ApiError(400, "Avatar upload failed")
    }

    // create user object - create entry in db
    
    const user = await User.create({
        fullName,
        username : username.toLowerCase(),
        email,
        password,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
    })

    // check for user creation
    
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    // remove password and refresh token field from response
    
    if(!createdUser){
        throw new ApiError(500, "User creation failed")
    }
    
    // return response 

    return res.status(201).json(new ApiResponse(201,createdUser,"User Created Successfully"))


})

export { registerUser }