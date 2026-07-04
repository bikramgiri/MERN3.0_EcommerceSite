import express, { Router } from 'express'
import categoryController from '../../../controllers/admin/category/categoryController';
import authMiddleware, { Role } from '../../../middleware/authMiddleware';
import catchAsyncError from '../../../services/catchAsyncError';
import { upload } from '../../../middleware/multerMiddleware';
import { cloudinaryUpload } from '../../../cloudinary';

const router:Router = express.Router()

router.route("/category")
.post(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin),  upload.single('categoryImage'), cloudinaryUpload,  catchAsyncError(categoryController.addCategory))
.get(catchAsyncError(categoryController.fetchAllCategories))

router.route("/category/:id")
.get(catchAsyncError(categoryController.fetchSingleCategory))
.patch(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin),  upload.single('categoryImage'), cloudinaryUpload, (categoryController.updateCategory))
.delete(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), catchAsyncError(categoryController.deleteCategory))

export default router;