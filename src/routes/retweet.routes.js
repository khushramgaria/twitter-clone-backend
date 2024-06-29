import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { retweet } from "../controllers/retweet.controller.js";

const router = Router()

router.route("/retweet-post").post(
    verifyJWT,
    retweet
)

export default router