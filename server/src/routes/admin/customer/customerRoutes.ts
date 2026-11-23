import express, { Router } from 'express';
import authMiddleware, { Role } from '../../../middleware/authMiddleware';
import CustomerController from '../../../controllers/admin/customer/customerController';
import catchAsyncError from '../../../services/catchAsyncError';

const router:Router = express.Router()
const adminOnly = [authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin)];

router.route("/customer")
.get(...adminOnly, catchAsyncError(CustomerController.fetchAllCustomers))

router.route("/customer/:id/block")
.patch(...adminOnly, catchAsyncError(CustomerController.setBlocked))

router.route("/customer/:id")
.get(...adminOnly, catchAsyncError(CustomerController.fetchCustomer))
.delete(...adminOnly, catchAsyncError(CustomerController.deleteCustomer))

export default router;
