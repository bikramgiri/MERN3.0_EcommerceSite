import app from "./src/app";
import { envConfig } from './src/config/config';
import adminSeeder from './src/adminseeder';

function startServer() {
      adminSeeder()
      const port = envConfig.port;
      app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
      });
}

startServer();
