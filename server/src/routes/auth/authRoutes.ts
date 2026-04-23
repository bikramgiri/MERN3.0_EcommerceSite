import express from 'express'
import AuthController from '../../controllers/auth/authController';

const router = express.Router()

router.route("/register").post(AuthController.register)
router.route("/login").post(AuthController.login)
router.route("/forgot-password").post(AuthController.forgotPassword)

export default router;