import express, { Router } from 'express'
import categoryController from '../../../controllers/admin/category/categoryController';
import authMiddleware from '../../../middleware/authMiddleware';

const router:Router = express.Router()

router.route("/category")
.post(authMiddleware.isAuthenticated, categoryController.addCategory)
.get(categoryController.fetchAllCategories)

router.route("/category/:id")
.get(categoryController.fetchSingleCategory)
.patch(authMiddleware.isAuthenticated, categoryController.updateCategory)
.delete(authMiddleware.isAuthenticated, categoryController.deleteCategory)

export default router;