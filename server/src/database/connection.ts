import { Sequelize } from "sequelize-typescript";
import { envConfig } from "../config/config";
import User from "./models/userModel";
import Product from "./models/productModel";
import Category from "./models/categoryModel";
import Order from "./models/orderModel";
import OrderDetails from "./models/orderDetailsModel";
import Payment from "./models/paymentModel";
import Cart from "./models/cartModel";
import Review from "./models/reviewModel";
import Wishlist from "./models/wishlistModel";

// const sequelize = new Sequelize(envConfig.dbConnectionString as string, {
//   models: [__dirname + '/models'] // Path to your models
// });

// Or
const sequelize = new Sequelize(envConfig.dbConnectionString as string, {
  // dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  models: [__dirname + "/models"], // Path to your models
});

// *Relationships

// Relationship between Product and User
// Product.belongsTo(User, { foreignKey: 'userId'})
// User.hasMany(Product, { foreignKey: 'userId'})

// // Relationship between Product and Category
// Product.belongsTo(Category, { foreignKey: 'categoryId'})
// Category.hasMany(Product, { foreignKey: 'categoryId'})

// Relationship between Order and User
Order.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Order, { foreignKey: "userId" });

// Relationship between Order and Payment
Order.belongsTo(Payment, { foreignKey: "paymentId" });
Payment.hasOne(Order, { foreignKey: "paymentId" });

// Relationship between OrderDetails and Order
OrderDetails.belongsTo(Order, { foreignKey: "orderId" });
Order.hasMany(OrderDetails, { foreignKey: "orderId" });

// Relationship between OrderDetails and Product
OrderDetails.belongsTo(Product, { foreignKey: "productId" });
Product.hasMany(OrderDetails, { foreignKey: "productId" });

// // Relationship between Cart and User
// Cart.belongsTo(User, { foreignKey: "userId" });
// User.hasMany(Cart, { foreignKey: "userId" });

// // Relationship between Cart and Product
// Cart.belongsTo(Product, { foreignKey: "productId" });
// Product.hasMany(Cart, { foreignKey: "productId" });

// // Relationship between Review and User
// Review.belongsTo(User, { foreignKey: "userId" });
// User.hasMany(Review, { foreignKey: "userId" });

// // Relationship between Review and Product
// Review.belongsTo(Product, { foreignKey: "productId" });
// Product.hasMany(Review, { foreignKey: "productId" });

// // Relationship between Wishlist and User
// Wishlist.belongsTo(User, { foreignKey: "userId" });
// User.hasMany(Wishlist, { foreignKey: "userId" });

// // Relationship between Wishlist and Product
// Wishlist.belongsTo(Product, { foreignKey: "productId" });
// Product.hasMany(Wishlist, { foreignKey: "productId" });

// Relationship between User and Product (Favorite Products)
User.belongsToMany(Product, {
  through: Wishlist,
  foreignKey: "userId",
  otherKey: "productId",
  as: "WishlistProducts",
});

Product.belongsToMany(User, {
  through: Wishlist,
  foreignKey: "productId",
  otherKey: "userId",
  as: "UsersWhoWishlisted",
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // Safe column migration for reviews table
    try {
      await sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_reviews_status') THEN
            CREATE TYPE "enum_reviews_status" AS ENUM ('APPROVED', 'PENDING', 'FLAGGED');
          END IF;

          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'status') THEN
            ALTER TABLE "reviews" ADD COLUMN "status" "enum_reviews_status" DEFAULT 'APPROVED';
          END IF;

          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'adminReply') THEN
            ALTER TABLE "reviews" ADD COLUMN "adminReply" TEXT DEFAULT NULL;
          END IF;

          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'repliedAt') THEN
            ALTER TABLE "reviews" ADD COLUMN "repliedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL;
          END IF;
        END $$;
      `);
      // Update any null status rows to 'APPROVED'
      await sequelize.query(`UPDATE "reviews" SET "status" = 'APPROVED' WHERE "status" IS NULL;`);
    } catch (migError) {
      console.warn("Reviews column migration notice:", migError);
    }

    // Safe column migration for store settings added after the table was first created
    try {
      await sequelize.query(`
        ALTER TABLE IF EXISTS "store_settings"
          ADD COLUMN IF NOT EXISTS "facebookUrl" VARCHAR(255) NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS "instagramUrl" VARCHAR(255) NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS "xUrl" VARCHAR(255) NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS "linkedinUrl" VARCHAR(255) NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS "localDeliveryArea" VARCHAR(255) NOT NULL DEFAULT 'Kathmandu Valley',
          ADD COLUMN IF NOT EXISTS "localDeliveryTime" VARCHAR(255) NOT NULL DEFAULT '1–2 business days',
          ADD COLUMN IF NOT EXISTS "otherDeliveryTime" VARCHAR(255) NOT NULL DEFAULT '3–5 business days',
          ADD COLUMN IF NOT EXISTS "returnWindowDays" INTEGER NOT NULL DEFAULT 7;
      `);
    } catch (migError) {
      console.warn("Store settings column migration notice:", migError);
    }

    // Safe column migration for newsletter double opt-in (table created before these columns existed).
    // Existing rows become CONFIRMED so nobody who already signed up is dropped.
    try {
      await sequelize.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'newsletter_subscribers')
             AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_subscribers' AND column_name = 'status') THEN
            ALTER TABLE "newsletter_subscribers"
              ADD COLUMN "status" VARCHAR(255) NOT NULL DEFAULT 'CONFIRMED',
              ADD COLUMN "confirmTokenHash" VARCHAR(255) DEFAULT NULL,
              ADD COLUMN "confirmTokenExpiresAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
              ADD COLUMN "unsubscribeToken" VARCHAR(255) UNIQUE DEFAULT NULL,
              ADD COLUMN "confirmedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
              ADD COLUMN "unsubscribedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL;
            ALTER TABLE "newsletter_subscribers" ALTER COLUMN "status" SET DEFAULT 'PENDING';
            UPDATE "newsletter_subscribers"
              SET "confirmedAt" = "createdAt", "unsubscribeToken" = md5(random()::text || id::text);
          END IF;
        END $$;
      `);
    } catch (migError) {
      console.warn("Newsletter column migration notice:", migError);
    }

    // Safe column migration for the order price breakdown and promo codes
    try {
      await sequelize.query(`
        ALTER TABLE IF EXISTS "orders"
          ADD COLUMN IF NOT EXISTS "subtotalAmount" DECIMAL(10,2) DEFAULT NULL,
          ADD COLUMN IF NOT EXISTS "shippingFee" DECIMAL(10,2) DEFAULT NULL,
          ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS "couponCode" VARCHAR(40) DEFAULT NULL;
        ALTER TABLE IF EXISTS "order_details"
          ADD COLUMN IF NOT EXISTS "unitPrice" DECIMAL(10,2) DEFAULT NULL;
        ALTER TABLE IF EXISTS "coupons"
          ADD COLUMN IF NOT EXISTS "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS "showToNewCustomers" BOOLEAN NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS "showOnSite" BOOLEAN NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS "bannerText" VARCHAR(120) NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS "lastEmailedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL;
      `);
    } catch (migError) {
      console.warn("Orders column migration notice:", migError);
    }

    await sequelize.sync({ force: false, alter: false }); // Set force to true to drop and recreate tables, alter to true to update tables
    console.log("Database Synced!");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
};

// *OR

// try {
//   sequelize.authenticate();
//   console.log('Connection has been established successfully.');
// } catch (error) {
//   console.error('Unable to connect to the database:', error);
// }

export { sequelize, connectDB };
