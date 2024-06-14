import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const registerUser = asyncHandler(async(req, res) => {

    // res.status(200).json({
    //     message: "okk"
    // })
    const {fullName, email, dob, password, username} = req.body

    if(
        [fullName, email, dob, password, username].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required !!")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(400, "Email or username is used !!")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    let coverImageLocalPath
    if(req.files && Array.isArray(req.files.coverImage) && req.file.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file not found !!")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Error while uplaoding file on cloudinary !!")
    }

    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        dob,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, createdUser, "User Registered Successfully !!")
    )

})

export { registerUser }
