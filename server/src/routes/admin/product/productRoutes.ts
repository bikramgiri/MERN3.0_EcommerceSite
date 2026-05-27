import express, { Router } from 'express'
import authMiddleware, { Role } from '../../../middleware/authMiddleware';
import ProductController from '../../../controllers/admin/product/productController';
import { upload } from '../../../middleware/multerMiddleware';
import catchAsyncError from '../../../services/catchAsyncError';

const router:Router = express.Router()

router.route("/product")
.post(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin),  upload.single('productImage'), catchAsyncError(ProductController.addProduct))
.get(catchAsyncError(ProductController.fetchAllProducts))

router.route("/product/category/:categoryId")
.get(catchAsyncError(ProductController.fetchProductsByCategory))

router.route("/product/user/:userId")
.get(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), catchAsyncError(ProductController.fetchProductsByUser))

router.route("/product/:id")
.get(catchAsyncError(ProductController.fetchSingleProduct))
.patch(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), upload.single('productImage'), catchAsyncError(ProductController.updateProduct))
.delete(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), catchAsyncError(ProductController.deleteProduct))

export default router;