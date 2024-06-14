import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { publishATweet } from "../controllers/tweet.controllers.js";

const router = Router()

router.route("/publish-a-tweet").post(
    verifyJWT,
    upload.fields([
        {
            name: "media",
            maxCount: 1
        }
    ]),
    publishATweet
)

export default router