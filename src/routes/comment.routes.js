import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getTweetComments,
    // updateComment,
} from "../controllers/comment.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// router.route("/:videoId").get(getVideoComments).post(addComment);
// router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

router.route("/add-comment").post(
    verifyJWT,
    upload.single("media"),
    addComment
)

router.route("/delete-comment").delete(
    verifyJWT,
    deleteComment
)

router.route("/get-tweet-comments").get(
    getTweetComments
)

export default router