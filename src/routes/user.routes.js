import { Router } from "express";
import { getCurrentUser, getUserChannelProfile, loginuser, logoutUser, refreshAccessToken, registerUser, updateAvatar, updateCoverImage, updateUserDetails } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post( 
    // upload.fields([
    //     {
    //         name: "avatar",
    //         maxCount: 1
    //     },
    //     {
    //         name: "coverImage",
    //         maxCount: 1
    //     }
    // ]),
    registerUser 
)

router.route("/login").post( loginuser )

//secured route
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post( refreshAccessToken )
router.route("/update-details").post( verifyJWT, updateUserDetails )
router.route("/update-avatar").patch(
    verifyJWT,
    upload.single("avatar"),
    updateAvatar
)
router.route("/update-coverimage").patch(
    verifyJWT,
    upload.single("coverImage"),
    updateCoverImage
)
router.route("/get-current-user").get(verifyJWT, getCurrentUser)

router.route("/get-user-channel-profile").get(
    verifyJWT,
    getUserChannelProfile
)

export default router;