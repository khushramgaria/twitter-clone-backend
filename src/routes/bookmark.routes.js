import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { bookmark, bookmarkTweets } from "../controllers/bookmark.controller.js";

const router = Router()

router.route("/bookmark-post").post(
    verifyJWT,
    bookmark
)

router.route("/bookmark-tweets").get(
    verifyJWT,
    bookmarkTweets
)

export default router