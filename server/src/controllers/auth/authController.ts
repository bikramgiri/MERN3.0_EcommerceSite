import { Request, Response } from "express";
import User from "../../database/models/userModel";
import bcrypt from "bcrypt";
import generateToken from "../../services/generateToken";
class AuthController {
  // *User Registration
  static async register(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        res.status(400).json({
          message: "All fields username, email and password are required",
          field: "general",
        });
        return;
      }

      if (username.length < 3) {
        res.status(400).json({
          message: "Username must be at least 3 characters long",
          field: "username",
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          message: "Invalid email format",
          field: "email",
        });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({
          message: "Password must be at least 8 characters long",
          field: "password",
        });
        return;
      }

      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        res.status(400).json({
          message: "Email already exists",
          field: "email",
        });
        return;
      }

      const registerData = await User.create({
        username,
        email,
        password: bcrypt.hashSync(password, 10),
      });

      // Never return password in response
      const { password: _, ...userWithoutPassword } = registerData.toJSON();

      res.status(201).json({
        message: "User registered successfully",
        data: userWithoutPassword,
      });
    } catch (error) {
      res.status(500).json({
        message: "Something went wrong",
      });
    }
  }

  // *User Login
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({
          message: "Email and password are required",
          field: "general",
        });
        return;
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.status(400).json({
          message: "Email does not exist",
          field: "email",
        });
        return;
      }

      const isPasswordValid = bcrypt.compareSync(password, user.password);
      if (!isPasswordValid) {
        res.status(400).json({
          message: "Invalid password",
          field: "password",
        });
        return;
      }

      const token = generateToken(user.id);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      // Never return password in response
      const { password: _, ...userWithoutPassword } = user.toJSON();

      res.status(200).json({
        message: "User logged in successfully",
        data: userWithoutPassword,
        token: token,
      });
    } catch (error) {
      res.status(500).json({
        message: "Something went wrong",
      });
    }
  }
}

export default AuthController;
