import express, { Router } from "express";
import authMiddleware, { Role } from "../../../middleware/authMiddleware";
import { couponRateLimiter } from "../../../middleware/rateLimiter";
import catchAsyncError from "../../../services/catchAsyncError";
import CouponController from "../../../controllers/customer/coupon/couponController";

const router: Router = express.Router();

router
  .route("/coupon/apply")
  .post(couponRateLimiter, authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), catchAsyncError(CouponController.applyCoupon));

router
  .route("/coupon/order/:orderId")
  .get(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), catchAsyncError(CouponController.getOrderCoupon));

router.route("/promotions").get(catchAsyncError(CouponController.getPromotions));

router
  .route("/coupon/welcome")
  .get(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Customer), catchAsyncError(CouponController.getWelcomeOffer));

export default router;
