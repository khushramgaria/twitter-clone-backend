import mongoose, {Schema} from "mongoose";


const likeSchema = new Schema({
    tweet: {
        type: Schema.Types.ObjectId,
        ref: "Tweet"
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
}, {timestamps: true})

export const Like = mongoose.model("Like", likeSchema)