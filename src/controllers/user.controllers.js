import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Follower } from "../models/followers.model.js";

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

const checkUserExists = asyncHandler( async(req, res) => {
  const { userId } = req.body

  console.log(req.body)

  const user = await User.findOne({ $or: [{email: userId}, {username: userId}]})

  if (!user) {
    return res
    .status(401)
    .json(
      new ApiResponse(401, {}, "Incorrect credentials !!")
    )
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200, user, "User Exists")
  )
})

const changePassword = asyncHandler( async(req, res) => {
  const { userId, oldPassword, newPassword } = req.body

  console.log(req.body)

  const user = await User.findOne({ $or: [{ email: userId }, { username: userId}]})

  console.log(user)

  if (!user) {
    throw new ApiError(401, "Invalid Credentials !!")
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  console.log(isPasswordCorrect)

  if (!isPasswordCorrect) {
    return res
    .json(
      { message: "Incorrect old password",
        statusCode: 401
       }
    )
  }

  user.password = newPassword
  await user.save({ validateBeforeSave: false})

  return res
  .status(200)
  .json(
    new ApiResponse(200, {}, "Password Changed Successfully")
  )
})

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: req.user?._id
      }
    },
    {
      $lookup: {
        from: "followers",
        localField: "_id",
        foreignField: "channel",
        as: "followers"
      }
    },
    {
      $lookup: {
        from: "followers",
        localField: "_id",
        foreignField: "subscriber",
        as: "followedTo"
      }
    },
    {
      $unwind: {
        path: "$followedTo",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "followedTo.channel",
        foreignField: "_id",
        as: "followedTo.channelDetails"
      }
    },
    {
      $unwind: {
        path: "$followedTo.channelDetails",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: "$_id",
        followers: { $first: "$followers" },
        followedTo: { $push: "$followedTo.channelDetails" },
        fullName: { $first: "$fullName" },
        username: { $first: "$username" },
        email: { $first: "$email" },
        avatar: { $first: "$avatar" },
        coverImage: { $first: "$coverImage" },
        createdAt: { $first: "$createdAt" },
        bio: { $first: "$bio" },
        location: { $first: "$location" },
        website: { $first: "$website" }
      }
    },
    {
      $addFields: {
        followersCount: {
          $size: "$followers"
        },
        channelFollowedToCount: {
          $size: "$followedTo"
        },
      }
    },
    {
      $project: {
        followersCount: 1,
        channelFollowedToCount: 1,
        fullName: 1,
        username: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        createdAt: 1,
        bio: 1,
        location: 1,
        website: 1,
        followedTo: 1
      }
    }
  ])

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Current User Fetched Successfully"));
});

const getUserChannelProfile = asyncHandler( async(req, res) => {
  console.log(req.query)
  const { username } = req.query

  if (!username) {
    throw new ApiError(400, "username is missing !!")
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "followers",
        localField: "_id",
        foreignField: "channel",
        as: "followers"
      }
    },
    {
      $lookup: {
        from: "followers",
        localField: "_id",
        foreignField: "subscriber",
        as: "followedTo"
      }
    },
    {
      $addFields: {
        followersCount: {
          $size: "$followers"
        },
        channelFollowedToCount: {
          $size: "$followedTo"
        },
        isFollowed: {
          $cond: {
            if: { $in: [req.user?._id, "$followers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        followersCount: 1,
        channelFollowedToCount: 1,
        isFollowed: 1,
        fullName: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        createdAt: 1,
        bio: 1,
        followers: 1
      }
    }
  ])

  console.log(channel)

  return res
  .status(200)
  .json(
    new ApiResponse(200, channel, "User Account Profile Fetched !!")
  )
})

export {
  registerUser,
  loginuser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  updateUserDetails,
  updateAvatar,
  updateCoverImage,
  checkUserExists,
  getCurrentUser,
  getUserChannelProfile
};
