import mongoose, { Schema} from "mongoose";

const retweetSchema = new Schema(
    {
        retweetBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        tweet: {
            type: Schema.Types.ObjectId,
            ref: "Tweet"
        }
    },
    {
        timestamps: true
    }
)

export const Retweet = mongoose.model("Retweet", retweetSchema)
