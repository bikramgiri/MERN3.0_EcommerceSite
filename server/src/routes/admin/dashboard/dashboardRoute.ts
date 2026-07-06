import { Router } from "express";
import express from 'express';
import authMiddleware, { Role } from "../../../middleware/authMiddleware";
import DashboardController from "../../../controllers/admin/dashboard/dashboardController";
import catchAsyncError from "../../../services/catchAsyncError";

const router:Router = express.Router()

router.route("/dashboard")
.get(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), (DashboardController.fetchAllData))

export default router
