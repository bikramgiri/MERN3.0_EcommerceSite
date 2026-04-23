import { Request, Response } from "express";
import User from "../../database/models/userModel";
import bcrypt from "bcrypt";
import generateToken from "../../services/generateToken";
import generateOtp from "../../services/generateOTP";
import sendMail from "../../services/sendMail";
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

      await sendMail({
        to: email,
        subject: "Welcome to Truvora!",
        text: `Hi ${username},\n\nThank you for registering at Truvora. We're excited to have you on board! If you have any questions or need assistance, feel free to reach out to our support team.\n\nBest regards,\nThe Truvora Team`
      })

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

      await sendMail({
        to: email,
        subject: "Login Alert",
        text: `Hi ${user.username},\n\nWe noticed a login to your Truvora account. If this was you, you can safely ignore this email. If you did not log in, please secure your account immediately by changing your password and enabling two-factor authentication.\n\nBest regards,\nThe Truvora Team`
      })

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

  // *User Logout
  static logout(req: Request, res: Response) {
    try {
      res.clearCookie("token");
      res.clearCookie("user");
      res.status(200).json({
        message: "User logged out successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: "Something went wrong",
      });
    }
  }

  // *Forgot Password
  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body
      if( !email ) {
        res.status(400).json({
          message: "Please provide your email",
          field: "email"
        })
        return
      }

      const [user] = await User.findAll({ where: { email}})
      if( !user) {
        res.status(400).json({
          message: "Email is not registered",
          field: "email"
        })
        return
      }

      const generatedOtp = generateOtp();

      user.otp = generatedOtp;
      user.otpGeneratedTime = new Date();
      await user.save();

      await sendMail({
        to: email,
        subject: "Password Reset OTP",
        text: `Your OTP for password reset is: ${generatedOtp}. It is valid for 5 minutes. If you did not request this, please ignore this email.`
      })

      res.status(200).json({
        message: "OTP sent to your email address for password reset. Please check your email.",
      })

    } catch (error) {
      res.status(500).json({
        message: "Something went wrong",
      });
    }
  }
}

export default AuthController;
