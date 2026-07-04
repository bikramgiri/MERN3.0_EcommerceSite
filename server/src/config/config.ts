import {config} from 'dotenv';
import { escape } from 'sequelize/lib/sql-string';
config();

export const envConfig = {
  port: process.env.PORT,
  dbConnectionString: process.env.DB_CONNECTION_STRING,
  jwtSecretKey: process.env.JWT_SECRET_KEY,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  email: process.env.EMAIL,
  emailPassword: process.env.EMAIL_PASSWORD,
  adminUsername: process.env.ADMIN_USERNAME,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  backendUrl: process.env.BACKEND_URL,
  clientUrl: process.env.CLIENT_URL,
  khaltiPaymentUrl: process.env.KHALTI_PAYMENT_URL,
  khaltiSecretKey: process.env.KHALTI_SECRET_KEY,
  khaltiVerificationUrl: process.env.KHALTI_VERIFICATION_URL,
  esewaMerchantId: process.env.ESEWA_MERCHANT_ID,
  esewaSecret: process.env.ESEWA_SECRET,
  esewaPaymentUrl: process.env.ESEWA_PAYMENT_URL,
  esewaVerificationUrl: process.env.ESEWA_PAYMENT_STATUS_CHECK_URL,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  cloudinaryBaseUrl: process.env.CLOUDINARY_BASE_URL,
};