import express, { Router } from "express";
import catchAsyncError from "../../../services/catchAsyncError";
import NewsletterController from "../../../controllers/customer/newsletter/newsletterController";
import { newsletterRateLimiter } from "../../../middleware/rateLimiter";
import authMiddleware, { Role } from "../../../middleware/authMiddleware";

const router: Router = express.Router();

router.route("/customer/newsletter")
.post(newsletterRateLimiter, catchAsyncError(NewsletterController.subscribe));

router.route("/customer/newsletter/confirm")
.post(catchAsyncError(NewsletterController.confirm));

router.route("/customer/newsletter/unsubscribe")
.post(catchAsyncError(NewsletterController.unsubscribe));

router.route("/admin/newsletter")
.get(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), catchAsyncError(NewsletterController.fetchSubscribers));

router.route("/admin/newsletter/:id")
.delete(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), catchAsyncError(NewsletterController.deleteSubscriber));

export default router;
