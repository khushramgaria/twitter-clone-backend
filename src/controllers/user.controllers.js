import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userid) => {
  try {
    const user = await User.findById(userid);
    console.log(user);

    const accessToken = await user.generateAccessToken();
    console.log(accessToken);
    const refreshToken = await user.generateRefreshToken();

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      400,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, dob, password, username } = req.body;

  console.log(req.body);

  if (
    [fullName, email, dob, password, username].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required !!");
  }

  console.log(username);
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(400, "Email or username is used !!");
  }

  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    dob,
    password,
    email,
    // avatar: avatar.url,
    // coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully !!"));
});

const loginuser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "Email or username is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    // throw new ApiError(400, "Invalid Email or Username");
    return res.json({
      status:400,
      message:"Invalid Email or Username"
   })
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    // throw new ApiError(400, "Invalid password");
     return res.json({
        status:400,
        message:"Wrong Password"
     })
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "Logged In Successfully !!"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User Logged Out Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(400, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(400, "Invalid refresh token");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Error while refreshing access token");
  }
});

const updateUserDetails = asyncHandler( async(req, res ) => {
  const { fullName, location, bio, website } = req.body;

  console.log(req.body);

  if (!fullName ) {
    throw new ApiError(400, "Full Name can't be empty")
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        bio,
        location,
        website
      }
    },
    { new: true }
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200, updatedUser, "Details Updated Successfully")
  )
})

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file not found !!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Error while uplaoding file on cloudinary !!");
  }

  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, avatar, "Avatar Updated Successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image is required !!");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage) {
    throw new ApiError(400, "Error while uploading cover image on cloudinary");
  }

  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage?.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, coverImage, "Cover Image Updated Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User Fetched Successfully"));
});

export {
  registerUser,
  loginuser,
  logoutUser,
  refreshAccessToken,
  updateUserDetails,
  updateAvatar,
  updateCoverImage,
  getCurrentUser,
};
