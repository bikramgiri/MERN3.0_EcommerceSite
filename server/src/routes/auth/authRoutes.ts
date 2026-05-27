import express, { Router } from 'express'
import AuthController from '../../controllers/auth/authController';
import authMiddleware from '../../middleware/authMiddleware';
import catchAsyncError from '../../services/catchAsyncError';

const router:Router = express.Router()

router.route("/register").post(catchAsyncError(AuthController.register))
router.route("/login").post(catchAsyncError(AuthController.login))
router.route("/forgot-password").post(catchAsyncError(AuthController.forgotPassword))
router.route("/verify-otp").post(catchAsyncError(AuthController.verifyOtp))
router.route("/reset-password").post(catchAsyncError(AuthController.resetPassword))
router.route("/change-password").post(authMiddleware.isAuthenticated, catchAsyncError(AuthController.changePassword))

export default router;