import { Router } from "express";
import express from 'express';
import authMiddleware, { Role } from "../../../middleware/authMiddleware";
import catchAsyncError from "../../../services/catchAsyncError";
import ReviewController from "../../../controllers/customer/review/reviewController";
import { upload } from "../../../middleware/multerMiddleware";
import { cloudinaryUpload } from "../../../cloudinary";

const router:Router = express.Router();

router.route("/review/:id")
.post(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), upload.single("reviewImage"), cloudinaryUpload, catchAsyncError(ReviewController.addReview))
.get(catchAsyncError(ReviewController.getProductReviews))
.patch(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), upload.single("reviewImage"), cloudinaryUpload, catchAsyncError(ReviewController.editReview))
.delete(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), catchAsyncError(ReviewController.deleteReview));

router.route("/review")
.get(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), catchAsyncError(ReviewController.getMyReviews));

export default router;