import { Router } from "express";
import authMiddleware, { Role } from "../../../middleware/authMiddleware";
import CustomerOrderController from "../../../controllers/customer/order/customerOrderController";
import catchAsyncError from "../../../services/catchAsyncError";

const router:Router = require("express").Router();

router.route("/order")
.post(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), catchAsyncError(CustomerOrderController.createOrder))
.get(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), catchAsyncError(CustomerOrderController.fetchMyOrders));

router.route("/order/:id")
.get(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), catchAsyncError(CustomerOrderController.fetchMySingleOrder))
.patch(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), catchAsyncError(CustomerOrderController.updateOrder))
.delete(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), catchAsyncError(CustomerOrderController.deleteOrder));

router.route('/order/cancel/:id')
.patch(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), CustomerOrderController.cancelOrder);

router.route('/verify-khalti-payment')
.post(authMiddleware.isAuthenticated, catchAsyncError(CustomerOrderController.verifyKhaltiPayment));

router.route('/verify-esewa-payment')
.post(authMiddleware.isAuthenticated, catchAsyncError(CustomerOrderController.verifyEsewaPayment));

export default router;