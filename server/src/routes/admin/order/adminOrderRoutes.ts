
import { Router } from "express";
import authMiddleware, { Role } from "../../../middleware/authMiddleware";
import catchAsyncError from "../../../services/catchAsyncError";
import AdminOrderController from "../../../controllers/admin/order/adminOrderController";

const router:Router = require("express").Router();

router.route("/order")
.get(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), catchAsyncError(AdminOrderController.fetchAllOrders));

router.route("/order/:id")
.get(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), catchAsyncError(AdminOrderController.fetchSingleOrder))
.patch(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), catchAsyncError(AdminOrderController.updateOrderStatus))
.delete(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), catchAsyncError(AdminOrderController.deleteOrder));

export default router;