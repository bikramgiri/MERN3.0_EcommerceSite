import { Sequelize } from 'sequelize-typescript';
import { envConfig } from '../config/config';

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

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

// *OR

// try {
//   sequelize.authenticate();  
//   console.log('Connection has been established successfully.');
// } catch (error) {
//   console.error('Unable to connect to the database:', error);
// }

sequelize.sync({force : false, alter: false}).then(()=>{
    console.log("Database Synced!");
})

export { sequelize, connectDB };
