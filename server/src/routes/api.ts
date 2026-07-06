import { Router } from "express";
import express from 'express';
import authRoutes from './auth/authRoutes';
import categoryRoutes from './admin/category/categoryRoutes';
import customerRoutes from './admin/customer/customerRoutes';
import adminOrderRoutes from './admin/order/adminOrderRoutes';
import productRoutes from './admin/product/productRoutes';
import adminReviewRoutes from './admin/review/adminReviewRoutes';
import dashboardRoutes from './admin/dashboard/dashboardRoute';
import profileRoutes from './common/profileRoutes';
import cartRoutes from './customer/cart/cartRoutes';
import reviewRoutes from './customer/review/reviewRoutes';
import wishlistRoutes from './customer/wishlist/wishlistRoutes';
import customerOrderRoutes from './customer/order/customerOrderRoutes';

const router: Router = express.Router()

router.use("/auth", authRoutes)
router.use("/admin", categoryRoutes)
router.use("/admin", customerRoutes)
router.use("/admin", adminOrderRoutes)
router.use("/admin", productRoutes)
router.use("/admin", adminReviewRoutes)
router.use("/admin", dashboardRoutes)
router.use("/common", profileRoutes)
router.use("/customer", cartRoutes)
router.use("/customer", customerOrderRoutes)
router.use("/customer", reviewRoutes)
router.use("/customer", wishlistRoutes)

export default router;
