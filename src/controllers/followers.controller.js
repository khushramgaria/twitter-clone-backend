import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Follower } from "../models/followers.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleFollowers = asyncHandler(async (req, res) => {
    console.log(req.body)
    const { username } = req.body
    // console.log(req.body)
    // const { username } = req.body

    const user = await User.findOne({ username })

    if (!user) {
        throw new ApiError(400, "user not found with this username !!")
    }

    const isFollowed = await Follower.findOne({
        $and: [{ subscriber: req.user?._id }, { channel: user._id }]
    })

    console.log("isFollowed: ", isFollowed)

    if (!isFollowed) {
        await Follower.create({
            subscriber: req.user?._id,
            channel: user._id
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Followed Successfully !!")
        )
    } else {
        await Follower.deleteOne({ _id: isFollowed._id})

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Unfollowed Successfully !!")
        )
    }
})

// controller to return subscriber list of a channel
const getUserChannelFollowers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
})

// controller to return channel list to which user has subscribed
const getFollowingChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleFollowers,
    getUserChannelFollowers,
    getFollowingChannels
}