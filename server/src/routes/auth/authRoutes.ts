import express from 'express'
import AuthController from '../../controllers/auth/authController';

const router = express.Router()

router.route("/register").post(AuthController.register)
router.route("/login").post(AuthController.login)

export default router;