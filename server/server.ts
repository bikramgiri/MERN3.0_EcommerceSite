import app from "./src/app";
import { envConfig } from './src/config/config';
import adminSeeder from './src/adminseeder';
import CategoryController from "./src/controllers/admin/category/categoryController";

function startServer() {
      const port = envConfig.port;
      app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
      });
      adminSeeder()
      CategoryController.seedCategory()
      
}

startServer();
