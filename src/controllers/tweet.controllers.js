import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Tweet } from "../models/tweet.model.js"

const publishATweet = asyncHandler(async(req, res) => {
    const { description } = req.body

    if (!description) {
        throw new ApiError(400, "Please write a tweet !!")
    };

    let mediaLocalPath;
    if (req.files && Array.isArray(req.files.media) && req.files.media.length > 0) {
        mediaLocalPath = req.files.media[0]?.path
    }

    const media = await uploadOnCloudinary(mediaLocalPath)

    const tweet = await Tweet.create({
        description,
        media: media?.url || ""
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

export { publishATweet }