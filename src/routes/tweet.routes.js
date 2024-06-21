import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { deleteTweet, getATweet, getAllTweets, getUserTweets, publishATweet } from "../controllers/tweet.controllers.js";

const router = Router()

router.route("/publish-a-tweet").post(
    verifyJWT,
    upload.single("media"),
    publishATweet
)

router.route("/get-user-tweets").get(
    verifyJWT,
    getUserTweets
)

router.route("/delete-tweet").delete(
    verifyJWT,
    deleteTweet
)

router.route("/get-all-tweets").get(
    verifyJWT,
    getAllTweets
)

router.route("/get-a-tweet").get(
    getATweet
)

export default router