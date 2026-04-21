import express from 'express';
import { connectDB } from './database/connection';
import userRoutes from './routes/auth/authRoutes';

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended : true}));

// *Database connection
connectDB();
// OR
// import './database/connection';

// *Routes
app.use("/api/auth", userRoutes);

export default app;

