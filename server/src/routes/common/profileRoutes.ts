import express, { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware";
import ProfileController from "../../controllers/common/profileController";
import { upload } from "../../middleware/multerMiddleware";
import { cloudinaryUpload } from "../../cloudinary";
import catchAsyncError from "../../services/catchAsyncError";

const router:Router = express.Router()

router.route("/profile")
.get(authMiddleware.isAuthenticated, catchAsyncError(ProfileController.fetchMyProfile))
.patch(authMiddleware.isAuthenticated, catchAsyncError(ProfileController.updateMyProfile))

router.route("/profile/avatar")
.patch(authMiddleware.isAuthenticated, upload.single('avatar'), cloudinaryUpload, catchAsyncError(ProfileController.updateMyAvatar))
.delete(authMiddleware.isAuthenticated, catchAsyncError(ProfileController.deleteMyAvatar))

export default router
