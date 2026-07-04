import { Router } from "express";
import express from 'express';
import WishlistController from "../../../controllers/customer/wishlist/wishlistController";
import catchAsyncError from "../../../services/catchAsyncError";
import authMiddleware, { Role } from "../../../middleware/authMiddleware";

const router:Router = express.Router()

router.route("/wishlist")
.post(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), catchAsyncError(WishlistController.addToWishlist))
.get(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), catchAsyncError(WishlistController.fetchWishlist))
.delete(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), catchAsyncError(WishlistController.removeFromWishlist))

export default router;