import express, { Router } from "express";
import authMiddleware, { Role } from "../../../middleware/authMiddleware";
import catchAsyncError from "../../../services/catchAsyncError";
import AdminCouponController from "../../../controllers/admin/coupon/adminCouponController";

const router: Router = express.Router();
const adminOnly = [authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin)];

router
  .route("/coupon")
  .get(...adminOnly, catchAsyncError(AdminCouponController.fetchCoupons))
  .post(...adminOnly, catchAsyncError(AdminCouponController.createCoupon));

router
  .route("/coupon/:id")
  .patch(...adminOnly, catchAsyncError(AdminCouponController.updateCoupon))
  .delete(...adminOnly, catchAsyncError(AdminCouponController.deleteCoupon));

router.route("/coupon/:id/email").post(...adminOnly, catchAsyncError(AdminCouponController.emailCoupon));

export default router;
