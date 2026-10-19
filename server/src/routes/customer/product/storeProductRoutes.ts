import express, { Router } from "express";
import catchAsyncError from "../../../services/catchAsyncError";
import StoreProductController from "../../../controllers/customer/product/storeProductController";

const router: Router = express.Router();

// Public storefront listing (search, filters, sort and pages handled by the server)
router.route("/products")
.get(catchAsyncError(StoreProductController.listProducts));

export default router;
