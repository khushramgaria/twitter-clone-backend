import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const getTweetComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    // const {page = 1, limit = 10} = req.query
    const { tweetId } = req.query

    console.log("req.query:")
    console.log(req.query)

    const comments = await Comment.aggregate([
        {
            $match: {
                tweet: new mongoose.Types.ObjectId(tweetId)
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $unwind: "$user"
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                "user.avatar": 1,
                "user.fullName": 1,
                "user.username": 1,
            }   
        }
    ])
    
    console.log("comments:")
    console.log(comments)

    return res
    .status(200)
    .json(
        new ApiResponse(200, { comments, totalComments }, "Comments Fetched !!")
    )
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { tweetId, content } = req.body

    console.log(req.body)
    console.log(req.file)

    let mediaLocalPath;
    let mediaUrl = "";

    if (req.file) {
        mediaLocalPath = req.file.path;
        console.log("mediaLocalPath:", mediaLocalPath)
        if (mediaLocalPath) {
            try {
                const media = await uploadOnCloudinary(mediaLocalPath);
                mediaUrl = media?.url || "";
            } catch (error) {
                throw new ApiError(500, "Failed to upload media");
            }
        }
    }
    
    const comment = await Comment.create({
        content: content,
        media: mediaUrl,
        tweet: tweetId,
        owner: req.user?._id
    })

    console.log("Comment: ", comment)

    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "Comment Added !!")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.body

    console.log(req.body)

    console.log("Comment Id: ", commentId)

    const comment = await Comment.findById(commentId)

    console.log(comment)

    if (!comment) {
        throw new ApiError(400, "Comment not found !!")
    }    

    const deletedTweet = await Comment.deleteOne({ _id: commentId })

    console.log(deletedTweet)

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Comment Deleted !!")
    )
})

export {
    getTweetComments, 
    addComment, 
    // updateComment,
     deleteComment
    }
