import express, { Router } from 'express'
import categoryController from '../../../controllers/admin/category/categoryController';
import authMiddleware, { Role } from '../../../middleware/authMiddleware';

const router:Router = express.Router()

router.route("/category")
.post(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), categoryController.addCategory)
.get(categoryController.fetchAllCategories)

router.route("/category/:id")
.get(categoryController.fetchSingleCategory)
.patch(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), categoryController.updateCategory)
.delete(authMiddleware.isAuthenticated, authMiddleware.authorizeRole(Role.Admin), categoryController.deleteCategory)

export default router;