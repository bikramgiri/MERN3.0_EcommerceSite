import express from 'express';
import { connectDB } from './database/connection';
import apiRoutes from './routes/api';

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended : true}));

// If i deploy behind something like Nginx, Render, Railway, 
// app.set("trust proxy", 1);

// *Route
app.use("/api", apiRoutes)

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

