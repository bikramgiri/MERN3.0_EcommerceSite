import express, { Router } from 'express'
import AuthController from '../../controllers/auth/authController';
import authMiddleware from '../../middleware/authMiddleware';
import catchAsyncError from '../../services/catchAsyncError';
import { loginRateLimiter, otpRateLimiter, registerRateLimiter, resetPasswordRateLimiter } from '../../middleware/rateLimiter';

const router:Router = express.Router()

router.route("/register").post(registerRateLimiter, catchAsyncError(AuthController.register))
router.route("/verify-email").post(otpRateLimiter, catchAsyncError(AuthController.verifyEmail))
router.route("/resend-verification-email").post(otpRateLimiter, catchAsyncError(AuthController.resendVerificationEmail))
router.route("/login").post(loginRateLimiter, catchAsyncError(AuthController.login))
router.route("/logout").post(catchAsyncError(AuthController.logout))
router.route("/forgot-password").post(otpRateLimiter, catchAsyncError(AuthController.forgotPassword))
router.route("/verify-otp").post(otpRateLimiter, catchAsyncError(AuthController.verifyOtp))
router.route("/reset-password").post(resetPasswordRateLimiter, catchAsyncError(AuthController.resetPassword))
router.route("/change-password").post(authMiddleware.isAuthenticated, catchAsyncError(AuthController.changePassword))

export default router;