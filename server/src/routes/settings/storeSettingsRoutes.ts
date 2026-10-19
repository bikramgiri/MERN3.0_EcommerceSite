import express, { Router } from "express";
import authMiddleware, { Role } from "../../middleware/authMiddleware";
import catchAsyncError from "../../services/catchAsyncError";
import StoreSettingsController from "../../controllers/admin/settings/storeSettingsController";

const router: Router = express.Router();

router.route("/settings")
.get(catchAsyncError(StoreSettingsController.fetchPublicSettings));

router.route("/admin/settings")
.get(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), catchAsyncError(StoreSettingsController.fetchAdminSettings))
.patch(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), catchAsyncError(StoreSettingsController.updateSettings));

export default router;
