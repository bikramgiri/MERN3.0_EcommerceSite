import express, { Router } from 'express';
import authMiddleware, { Role } from '../../../middleware/authMiddleware';
import CustomerController from '../../../controllers/admin/customer/customerController';

const router:Router = express.Router()

router.route("/customer")
.get(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), CustomerController.fetchAllCustomers)

router.route("/customer/:id")
.delete(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), CustomerController.deleteCustomer)

export default router;
