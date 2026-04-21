import { Request, Response } from "express";
import User from "../../database/models/userModel";
import bcrypt from 'bcrypt';
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

            if(username.length < 3){
                  res.status(400).json({
                        message : "Username must be at least 3 characters long",
                        field : "username"
                  });
                  return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if(!emailRegex.test(email)){
                  res.status(400).json({
                        message : "Invalid email format",
                        field : "email"
                  });
                  return;
            }

            const existingEmail = await User.findOne({where : {email}});
            if(existingEmail){
                  res.status(400).json({
                        message : "Email already exists",
                        field : "email"
                  });
                  return;
            }

            if(password.length < 8){
                  res.status(400).json({
                        message : "Password must be at least 8 characters long",
                        field : "password"
                  });
                  return;
            }

           try {
             const registerData = await User.create({
                  username,
                  email,
                  password : bcrypt.hashSync(password, 10) 
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
           } catch (error) {
                  res.status(500).json({
                        message : "Something went wrong"
                  });
           }
      }
}

export default AuthController;