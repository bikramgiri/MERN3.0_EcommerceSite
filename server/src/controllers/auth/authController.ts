import { Request, Response } from "express";
import User from "../../database/models/userModel";
import { sequelize } from "../../database/connection";

class AuthController {
      // *User Registration
      static async register(req:Request, res:Response){
            const {username, email, password} = req.body;
            if(!username || !email || !password){
                  res.status(400).json({
                        message : "All fields username, email and password are required",
                        field : "general"
                  });
                  return;
            }

            const registerData = await User.create({
                  username,
                  email,
                  password
            });

            // Or from raw queries
            // const registerData = await User.sequelize?.query(
            //       `INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)`,{
            //             replacements : ["b5a3f20d-6202-4159-abd9-0c33c6f70487", username, email, password],
            //       }
            // );

            res.status(201).json({
                  message : "User registered successfully",
                  data : registerData
            });
      }
}

export default AuthController;