import { Router } from "express";
import authMiddleware, { Role } from "../../../middleware/authMiddleware";
import CustomerOrderController from "../../../controllers/customer/order/customerOrderController";
import catchAsyncError from "../../../services/catchAsyncError";

const router:Router = require("express").Router();

router.route("/order")
.post(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), catchAsyncError(CustomerOrderController.createOrder))

router.route('/verify-khalti-payment')
.post(authMiddleware.isAuthenticated, catchAsyncError(CustomerOrderController.verifyKhaltiPayment));

export default router;