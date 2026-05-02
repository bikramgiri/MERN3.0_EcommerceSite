import { Sequelize } from 'sequelize-typescript';
import { envConfig } from '../config/config';
import User from './models/userModel';
import Product from './models/productModel';
import Category from './models/categoryModel';

// const sequelize = new Sequelize(envConfig.dbConnectionString as string, {
//   models: [__dirname + '/models'] // Path to your models
// });

// Or
const sequelize = new Sequelize(envConfig.dbConnectionString as string, {
  // dialect: 'postgres',
  logging: false,
  // dialectOptions: {
  //   ssl: {
  //     // require: true,
  //     rejectUnauthorized: false  
  //   }
  // },
  models: [__dirname + '/models'] // Path to your models
});

// *Relationships

// Relationship between User and Product
Product.belongsTo(User, { foreignKey: 'userId'})
User.hasMany(Product, { foreignKey: 'userId'})

// Relationship between Category and Product
Product.belongsTo(Category, { foreignKey: 'categoryId'})
Category.hasMany(Product, { foreignKey: 'categoryId'})


const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    await sequelize.sync({force : false, alter: false})
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
