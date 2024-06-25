import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

const addLike = asyncHandler( async(req, res) => {
    const { tweetId } = req.body

    console.log("tweetId: ", tweetId)
    console.log("req.query: ", req.body)

    const alreadyLiked = await Like.findOne({
        $and: [{ tweet: new mongoose.Types.ObjectId(tweetId)}, {likedBy: req.user?._id}]
    })

    console.log("alreadyLiked: ", alreadyLiked)

    if (alreadyLiked) {
        await Like.deleteOne({ _id: alreadyLiked._id})

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Unliked !!")
        )
    } else {
        await Like.create({
            tweet: tweetId,
            likedBy: req.user?._id
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Liked !!")
        )
    }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    addLike
}