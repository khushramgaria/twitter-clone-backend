import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Tweet } from "../models/tweet.model.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { Retweet } from "../models/Retweet.model.js";

const publishATweet = asyncHandler(async (req, res) => {
  const { description } = req.body;
  if (!description) {
    throw new ApiError(400, "Please write a tweet !!");
  }

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
    owner: req.user?._id,
  });

  if (!tweet) {
    throw new ApiError(500, "Something went wrong while posting !!");
  }

  return res.status(200).json(new ApiResponse(200, tweet, "Tweet Posted !!"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);

  console.log(user);

  if (!user) {
    throw new ApiError(400, "user not found");
  }

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: user._id,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "tweet",
        as: "commentCount",
      },
    },
    {
      $addFields: {
        commentsCount: { $size: "$commentCount" },
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likeCount",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likeCount",
        },
        isLiked: {
          $cond: {
            if: { $in: [user?._id, "$likeCount.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $lookup: {
        from: "retweets",
        localField: "_id",
        foreignField: "tweet",
        as: "retweetCount"
      }
    },
    {
      $addFields: {
        retweetsCount: {
          $size: "$retweetCount"
        },
        isRetweet: {
          $cond: {
            if: { $in: [user?._id, "$retweetCount.retweetBy"]},
            then: true,
            else: false
          }
        }
      }
    }
  ]);

  const retweets = await Retweet.aggregate([
    {
        $match: {
            retweetBy: user._id,
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
        $project: {
            _id: 0,
            retweetId: "$_id",
            retweetedAt: "$createdAt",
            tweet: "$tweetInfo",
            isRetweet: 1,
            user: "$userInfo"
        },
    },
    {
        $sort: {
            retweetedAt: -1,
        },
    },
]);

console.log("retweet: ", retweets)

const combinedTweets = [...tweets, ...retweets].sort((a, b) =>
  (b.createdAt || b.retweetedAt) - (a.createdAt || a.retweetedAt)
);

const tweetsCount = combinedTweets.length;

console.log("Tweet count: ", tweetsCount);

return res
.status(200)
.json(
  new ApiResponse(
    200,
    { tweets: combinedTweets, tweetsCount, user },
    "User Tweets Fetched !!"
  )
);
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { _id } = req.body;
  console.log("ID: ", _id);

  const tweet = await Tweet.findById(_id);

  if (!tweet) {
    throw new ApiError(400, "tweet not found !!");
  }

  console.log("tweet: ", tweet);

  const deletedTweet = await Tweet.deleteOne({ _id });

  console.log("deleted tweet: ", deletedTweet);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet Deleted Successfully !!"));
});

const getAllTweets = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: { $ne: user?._id },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $lookup: {
        from: "users", // the collection to join
        localField: "owner", // field from the input documents
        foreignField: "_id", // field from the documents of the "from" collection
        as: "userDetails", // output array field
      },
    },
    {
      $unwind: "$userDetails", // optional, to deconstruct the array field from the previous $lookup stage
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "tweet",
        as: "commentCount",
      },
    },
    {
      $addFields: {
        commentsCount: { $size: "$commentCount" },
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likeCount",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likeCount" },
        isLiked: {
            $cond: {
              if: { $in: [user?._id, "$likeCount.likedBy"] },
              then: true,
              else: false,
            },
          },
      },
    },
    {
      $lookup: {
        from: "retweets",
        localField: "_id",
        foreignField: "tweet",
        as: "retweetCount",
      },
    },
    {
      $addFields: {
        retweetsCount: { $size: "$retweetCount" },
        isRetweet: {
            $cond: {
              if: { $in: [user?._id, "$retweetCount.retweetBy"] },
              then: true,
              else: false,
            },
          },
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
        likesCount: 1,
        commentsCount: 1,
        description: 1,
        media: 1,
        createdAt: 1,
        "userDetails.username": 1,
        "userDetails.fullName": 1,
        "userDetails.avatar": 1,
        isLiked: 1,
        retweetsCount: 1,
        isRetweet: 1,
        isBookmarked: 1
      },
    },
  ]);

  console.log(tweets);

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "All Tweets Fetched !!"));
});

const getATweet = asyncHandler(async (req, res) => {
  const id = req.query;

  console.log(req.query);

  const tweet = await Tweet.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id.newTweetId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "tweetUserDetail",
      },
    },
    {
      $unwind: "$tweetUserDetail",
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "tweet",
        as: "commentCount",
      },
    },
    {
      $addFields: {
        commentsCount: { $size: "$commentCount" },
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likeCount",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likeCount" },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likeCount.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $lookup: {
        from: "retweets",
        localField: "_id",
        foreignField: "tweet",
        as: "retweetCount",
      },
    },
    {
      $addFields: {
        retweetsCount: { $size: "$retweetCount" },
        isRetweet: {
          $cond: {
            if: { $in: [req.user?._id, "$retweetCount.retweetBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        likesCount: 1,
        commentsCount: 1,
        description: 1,
        media: 1,
        createdAt: 1,
        "tweetUserDetail.fullName": 1,
        "tweetUserDetail.username": 1,
        "tweetUserDetail.avatar": 1,
        isLiked: 1,
        retweetsCount: 1,
        isRetweet: 1
      },
    },
  ]);

  console.log("tweet: ", tweet);

  return res.status(200).json(new ApiResponse(200, tweet, "Tweet Fetched !!"));
});

const getOtherUserTweets = asyncHandler(async (req, res) => {
  console.log(req.body);
  const user = await User.findOne({ username: req.body.username });

  console.log(user);

  if (!user) {
    throw new ApiError(400, "user not found");
  }

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: user._id,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "tweet",
        as: "commentCount",
      },
    },
    {
      $addFields: {
        commentsCount: { $size: "$commentCount" },
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likeCount",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likeCount",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likeCount.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
  ]);

  const tweetsCount = await Tweet.aggregate([
    {
      $match: {
        owner: user._id,
      },
    },
    {
      $count: "TotalTweets",
    },
  ]);

  console.log("Tweet count: ", tweetsCount);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { tweets, tweetsCount, user },
        "User Tweets Fetched !!"
      )
    );
});

export {
  publishATweet,
  getUserTweets,
  deleteTweet,
  getAllTweets,
  getATweet,
  getOtherUserTweets,
};
