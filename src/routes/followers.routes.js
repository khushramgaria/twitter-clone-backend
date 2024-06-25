import { Router } from 'express';
import {
    toggleFollowers,
    getUserChannelFollowers,
    getFollowingChannels
} from "../controllers/followers.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// router
//     .route("/c/:channelId")
//     .get(getSubscribedChannels)
//     .post(toggleSubscription);

// router.route("/u/:subscriberId").get(getUserChannelSubscribers);

router.route("/toggle-followers").post(
    verifyJWT,
    toggleFollowers
)

export default router