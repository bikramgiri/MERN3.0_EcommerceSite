import express, { Router } from 'express'
import authMiddleware, { Role } from '../../../middleware/authMiddleware';
import ProductController from '../../../controllers/admin/product/productController';
import { upload } from '../../../middleware/multerMiddleware';

const router:Router = express.Router()

router.route("/product")
.post(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin),  upload.single('productImage'), ProductController.addProduct)
.get(ProductController.fetchAllProducts)

router.route("/product/category/:categoryId")
.get(ProductController.fetchProductsByCategory)

router.route("/product/user/:userId")
.get(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), ProductController.fetchProductsByUser)

router.route("/product/:id")
.get(ProductController.fetchSingleProduct)
.patch(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), upload.single('productImage'), ProductController.updateProduct)
.delete(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), ProductController.deleteProduct)

export default router;