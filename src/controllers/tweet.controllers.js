import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Tweet } from "../models/tweet.model.js"
import mongoose from "mongoose"
import { User } from "../models/user.model.js"

const publishATweet = asyncHandler(async(req, res) => {
    const { description } = req.body
    if (!description) {
        throw new ApiError(400, "Please write a tweet !!")
    };

    let mediaLocalPath;
    let mediaUrl = "";

    if (req.file) {
        mediaLocalPath = req.file.path;
        if (mediaLocalPath) {
            try {
                const media = await uploadOnCloudinary(mediaLocalPath);
                mediaUrl = media?.url || "";
            } catch (error) {
                throw new ApiError(500, "Failed to upload media");
            }
        }
    }

    const tweet = await Tweet.create({
        description,
        media: mediaUrl,
        owner: req.user?._id
    })

    if (!tweet) {
        throw new ApiError(500, "Something went wrong while posting !!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "Tweet Posted !!")
    )
})

const getUserTweets = asyncHandler(async(req, res) => {
    const user = await User.findById(req.user?._id)

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: user._id
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ])

    const tweetsCount = await Tweet.aggregate([
        {
            $match: {
                owner: user._id
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $count: "TotalTweets"
        }
    ])

    console.log("Tweet count: ", tweetsCount)

    return res
    .status(200)
    .json(
        new ApiResponse(200, {tweets, tweetsCount}, "User Tweets Fetched !!")
    )
})

const deleteTweet = asyncHandler( async(req, res) => {
    const { _id } = req.body
    console.log("ID: ", _id)

    const tweet = await Tweet.findById(_id)

    if (!tweet) {
        throw new ApiError(400, "tweet not found !!")
    }

    console.log("tweet: ", tweet)

    const deletedTweet = await Tweet.deleteOne({ _id })

    console.log("deleted tweet: ", deletedTweet)

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Tweet Deleted Successfully !!")
    )

})

const getAllTweets = asyncHandler( async(req, res) => {
    const user = await User.findById(req.user?._id)

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: { $ne: user?._id }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $lookup: {
                from: "users", // the collection to join
                localField: "owner", // field from the input documents
                foreignField: "_id", // field from the documents of the "from" collection
                as: "userDetails" // output array field
            }
        },
        {
            $unwind: "$userDetails" // optional, to deconstruct the array field from the previous $lookup stage
        },
        {
            $project : {
                description: 1,
                media: 1,
                createdAt: 1,
                "userDetails.username": 1,
                "userDetails.fullName": 1,
                "userDetails.avatar": 1
            }
        }
    ])

    console.log(tweets)

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweets, "All Tweets Fetched !!")
    )
})

const getATweet = asyncHandler( async(req, res) => {
    const id = req.query

    console.log(req.query)

    const tweet = await Tweet.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id.newTweetId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "tweetUserDetail"
            }
        },
        {
            $unwind: "$tweetUserDetail"
        },
        {
            $project: {
                description: 1,
                media: 1,
                createdAt: 1,
                "tweetUserDetail.fullName": 1,
                "tweetUserDetail.username": 1,
                "tweetUserDetail.avatar": 1
            }
        }
    ])

    console.log("tweet: ", tweet)

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "Tweet Fetched !!")
    )
})

export { publishATweet, getUserTweets, deleteTweet, getAllTweets, getATweet }