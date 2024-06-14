import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
    {
        description: {
            type: String,
            required: true
        },
        media: {
            type: String,
        },
        isPosted: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        }
    },
    {
        timestamps: true
    }
)

export const Tweet = mongoose.model("Tweet", tweetSchema)