import express, {Router} from 'express';
import authMiddleware, { Role } from '../../../middleware/authMiddleware';
import CartController from '../../../controllers/customer/cart/cartController';
const router:Router = express.Router();
import catchAsyncError from "../../../services/catchAsyncError";

router.route('/cart')
.post(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), catchAsyncError(CartController.addToCart))
.get(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), catchAsyncError(CartController.getCartItems))

router.route('/cart/:id')
.get(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), catchAsyncError(CartController.getCartItem))
.patch(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), catchAsyncError(CartController.updateCartItem))
.delete(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), catchAsyncError(CartController.deleteCartItem));

export default router;