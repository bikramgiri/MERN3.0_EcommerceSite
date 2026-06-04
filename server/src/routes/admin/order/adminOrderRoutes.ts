
import { Router } from "express";
import authMiddleware, { Role } from "../../../middleware/authMiddleware";
import catchAsyncError from "../../../services/catchAsyncError";
import AdminOrderController from "../../../controllers/admin/order/adminOrderController";

const router:Router = require("express").Router();

router.route("/order/:id")
.patch(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), catchAsyncError(AdminOrderController.updateOrderStatus))

export default router;