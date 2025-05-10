import { Router } from 'express'
import { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, currentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory} from '../controllers/user.controller.js'
import { upload } from '../middlewares/multer.middleware.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
const router = Router()

router.route("/register").post(
    upload.fields([
    {
        name:"avatar",
        maxCount:1
    },
    {
        name : "coverImage",
        maxCount:1
    }
]),
    registerUser
)

router.route("/login").post(loginUser)

//Secured routes

router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, currentUser)
router.route("/update-account-details").patch(verifyJWT, updateAccountDetails)
router.route("/update-user-avatar").post(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/update-user-cover-image").post(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile)
router.route("/watch-history").get(verifyJWT, getWatchHistory)
export default router