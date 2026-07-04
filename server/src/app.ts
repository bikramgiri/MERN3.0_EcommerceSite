import express from 'express';
import { connectDB } from './database/connection';
import userRoutes from './routes/auth/authRoutes';
import categoryRoutes from './routes/admin/category/categoryRoutes';
import productRoutes from './routes/admin/product/productRoutes';
import customerOrderRoutes from './routes/customer/order/customerOrderRoutes';
import adminOrderRoutes from './routes/admin/order/adminOrderRoutes';
import cartRoutes from './routes/customer/cart/cartRoutes';
import reviewRoutes from './routes/customer/review/reviewRoutes';
import adminReviewRoutes from './routes/admin/review/adminReviewRoutes';
import wishlistRoutes from './routes/customer/wishlist/wishlistRoutes';

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended : true}));

// *Routes
app.use("/api/auth", userRoutes);
app.use("/api/admin", categoryRoutes)
app.use("/api/admin", productRoutes)
app.use("/api/admin", adminOrderRoutes)
app.use("/api/admin", adminReviewRoutes)
app.use("/api/customer", customerOrderRoutes)
app.use("/api/customer", cartRoutes)
app.use("/api/customer", reviewRoutes)
app.use("/api/customer", wishlistRoutes)

// *Give access to storage folder images
app.use("/src/storage", express.static("storage")); 
// *Or
// *Give access to images in storage folder
// app.use(express.static('storage'))

// *Database connection
// connectDB();
// OR
// import './database/connection';

// Export an init function that resolves once DB is ready
export const initApp = async () => {
  await connectDB();
  return app;
};

export default app;

