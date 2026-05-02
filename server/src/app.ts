import express from 'express';
import { connectDB } from './database/connection';
import userRoutes from './routes/auth/authRoutes';
import categoryRoutes from './routes/admin/category/categoryRoutes';
import productRoutes from './routes/admin/product/productRoutes';

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended : true}));

// *Database connection
connectDB();
// OR
// import './database/connection';

// *Routes
app.use("/api/auth", userRoutes);
app.use("/api/admin", categoryRoutes)
app.use("/api/admin", productRoutes)

// *Give access to storage folder images
app.use("/src/storage", express.static("storage")); 
// *Or
// *Give access to images in storage folder
// app.use(express.static('storage'))

export default app;

