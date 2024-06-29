import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Retweet } from "../models/Retweet.model.js";
import { Tweet } from "../models/tweet.model.js";

const retweet = asyncHandler( async(req, res) => {
    const { tweetId } = req.body

    console.log("req.body: ", req.body)

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(400, "Tweet not found")
    }

    const existingRetweet = await Retweet.findOne({
        $and: [{ retweetBy: req.user?._id },{ tweet: tweetId }]
    })

    if (!existingRetweet) {
        await Retweet.create({
            retweetBy: req.user?._id,
            tweet: tweetId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Retweeted Successfully !!")
        )        
    } else {
        await Retweet.deleteOne({ _id: existingRetweet._id })

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Undo Retweet !!")
        )     
    }
})

export { retweet }