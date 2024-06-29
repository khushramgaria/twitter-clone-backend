import mongoose, { Schema } from "mongoose";

const bookmarkSchema = new Schema(
    {
        bookmarkBy: {
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

export const Bookmark = mongoose.model("Bookmark", bookmarkSchema)