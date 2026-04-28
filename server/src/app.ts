import express from 'express';
import { connectDB } from './database/connection';
import userRoutes from './routes/auth/authRoutes';
import categoryRoutes from './routes/admin/category/categoryRoutes';

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

export default app;

