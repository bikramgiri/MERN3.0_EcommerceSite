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

sequelize.sync({force : false, alter: false}).then(()=>{ // force: true will drop the table if it already exists and create a new one, alter: true will check the current state of the table in the database (which columns it has, what are their data types, etc), and then perform the necessary changes in the table to make it match the model.
    console.log("Database Synced!");
})

export { sequelize, connectDB };
