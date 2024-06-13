import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
    {
        description: {
            type: String,
            required: true
        },
        media: {
            type: String,
        }
    },
    {
        timestamps: true
    }
)

export const Tweet = mongoose.model("Tweet", tweetSchema)