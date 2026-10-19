import express, { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware";
import catchAsyncError from "../../services/catchAsyncError";
import NotificationController from "../../controllers/common/notificationController";

const router: Router = express.Router();

// Signed-in customers and admins each get their own inbox
router.route("/notifications")
.get(authMiddleware.isAuthenticated, catchAsyncError(NotificationController.list));

router.route("/notifications/read-all")
.patch(authMiddleware.isAuthenticated, catchAsyncError(NotificationController.markAllRead));

router.route("/notifications/:id/read")
.patch(authMiddleware.isAuthenticated, catchAsyncError(NotificationController.markRead));

export default router;
