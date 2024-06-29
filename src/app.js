import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"

const app = express()

const corsOptions = {
    origin: process.env.CORS_ORIGIN, // Replace with process.env.CORS_ORIGIN if it's correctly set
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions))

//to set limit to take json
app.use(express.json({
    limit: "16kb"
}))

//to understand the url data 
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))

//
app.use(express.static("public"))

//to perform CRUD operations of user cookies browser with server securly 
app.use(cookieParser())

//router import 
import userRouter from "./routes/user.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import followerRouter from "./routes/followers.routes.js"
import retweetRouter from "./routes/retweet.routes.js"

//router declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweet", tweetRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/followers", followerRouter)
app.use("/api/v1/retweets", retweetRouter)

export { app }