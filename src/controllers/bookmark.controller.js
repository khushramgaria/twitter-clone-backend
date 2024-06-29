import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.model.js";
import { Bookmark } from "../models/bookmark.model.js";
import { User } from "../models/user.model.js";

const bookmark = asyncHandler( async(req, res) => {
    const { tweetId } = req.body

    console.log(req.body)

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found !!")
    }

    const isBookmarked = await Bookmark.findOne({
        $and: [{ bookmarkBy: req.user?._id }, { tweet: tweetId }]
    })

    if (!isBookmarked) {
        await Bookmark.create({
            bookmarkBy: req.user?._id,
            tweet: tweetId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Added to Bookmark !!")
        )
    } else {
        await Bookmark.deleteOne({ _id: isBookmarked._id})

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Remove from Bookmark !!")
        )
    }
})

const bookmarkTweets = asyncHandler( async(req, res) => {
    const user = await User.findById(req.user?._id);

    const bookmarks = await Bookmark.aggregate([
        {
            $match: {
                bookmarkBy: user._id,
            },
        },
        {
            $lookup: {
                from: "tweets",
                localField: "tweet",
                foreignField: "_id",
                as: "tweetInfo",
            },
        },
        {
            $unwind: "$tweetInfo",
        },
        {
            $lookup: {
                from: "comments",
                localField: "tweetInfo._id",
                foreignField: "tweet",
                as: "commentCount",
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "tweetInfo._id",
                foreignField: "tweet",
                as: "likeCount",
            },
        },
        {
            $lookup: {
                from: "retweets",
                localField: "tweetInfo._id",
                foreignField: "tweet",
                as: "retweetCount",
            },
        },
        {
          $lookup: {
            from: "users",
            localField: "tweetInfo.owner",
            foreignField: "_id",
            as: "userInfo"
          }
        },
        {
            $unwind: "$userInfo",
        },
        {
            $addFields: {
                "tweetInfo.commentsCount": { $size: "$commentCount" },
                "tweetInfo.likesCount": { $size: "$likeCount" },
                "tweetInfo.retweetsCount": { $size: "$retweetCount" },
                "tweetInfo.isLiked": {
                    $cond: {
                        if: { $in: [user?._id, "$likeCount.likedBy"] },
                        then: true,
                        else: false,
                    },
                },
                isRetweet: true,
            },
        },
        {
            $lookup: {
              from: "bookmarks",
              localField: "_id",
              foreignField: "tweet",
              as: "bookmarksTweet",
            },
          },
          {
            $addFields: {
              isBookmarked: {
                  $cond: {
                    if: { $in: [user?._id, "$bookmarksTweet.bookmarkBy"] },
                    then: true,
                    else: false,
                  },
                },
            },
          },
        {
            $project: {
                _id: 0,
                retweetId: "$_id",
                retweetedAt: "$createdAt",
                tweet: "$tweetInfo",
                isRetweet: 1,
                user: "$userInfo",
                isBookmarked: 1
            },
        },
        {
            $sort: {
                retweetedAt: -1,
            },
        },
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(200, bookmarks, "Bookmarks fetched !!")
    )
})

export { bookmark, bookmarkTweets }