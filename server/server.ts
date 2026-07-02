import { initApp } from "./src/app";
import { envConfig } from './src/config/config';
import adminSeeder from './src/adminseeder';
import CategoryController from "./src/controllers/admin/category/categoryController";

async function startServer() {
      const app = await initApp();   // waits for connectDB() -> authenticate() -> sync() to fully finish
      const port = envConfig.port;
      app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
      });
      await adminSeeder();
      await CategoryController.seedCategory()
      
}

startServer();
