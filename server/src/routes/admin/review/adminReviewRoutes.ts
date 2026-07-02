import { Router } from "express";
import express from 'express';
import authMiddleware, { Role } from "../../../middleware/authMiddleware";
import catchAsyncError from "../../../services/catchAsyncError";
import AdminReviewController from "../../../controllers/admin/review/adminReviewController";

const router:Router = express.Router();

router.route("/review")
.get(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), catchAsyncError(AdminReviewController.fetchAllReviews));

router.route("/review/:id")
.delete(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), catchAsyncError(AdminReviewController.deleteReview));

export default router;