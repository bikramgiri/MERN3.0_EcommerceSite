import { Sequelize } from 'sequelize-typescript';
import { envConfig } from '../config/config';
import User from './models/userModel';
import Product from './models/productModel';
import Category from './models/categoryModel';
import Order from './models/orderModel';
import OrderDetails from './models/orderDetailsModel';
import Payment from './models/paymentModel';
import Cart from './models/cartModel';
import Review from './models/reviewModel';
import Wishlist from './models/wishlistModel';

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
      rejectUnauthorized: false  
    }
  },
  models: [__dirname + '/models'] // Path to your models
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
  foreignKey: 'userId',
  otherKey: 'productId',
  as: 'WishlistProducts'
});

Product.belongsToMany(User, {
  through: Wishlist,
  foreignKey: 'productId',
  otherKey: 'userId',
  as: 'UsersWhoWishlisted'   
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    await sequelize.sync({force : false, alter: false}); // Set force to true to drop and recreate tables, alter to true to update tables
    console.log("Database Synced!");
  } catch (error) {
    console.error('Unable to connect to the database:', error);
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
