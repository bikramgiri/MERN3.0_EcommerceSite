import express from 'express';
import { connectDB } from './database/connection';
const app = express();

// Database connection
connectDB();
// *OR
// import './database/connection';


export default app;

