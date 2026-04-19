import {config} from 'dotenv';
config();

export const envConfig = {
      port: process.env.PORT,
      dbConnectionString: process.env.DB_CONNECTION_STRING,
}