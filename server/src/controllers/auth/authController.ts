import { Request, Response } from "express";
import User from "../../database/models/userModel";
import bcrypt from "bcrypt";
import generateToken from "../../services/generateToken";
import { sendMail, sendVerificationEmailCode } from "../../services/sendMail";
import generateOtp from "../../services/generateOtp";
import sendResponse from "../../services/sendResponse";
import findData from "../../services/findData";
import isOtpExpired from "../../services/checkOtpExpiration";
import { envConfig } from "../../config/config";
import jwt, { Secret } from "jsonwebtoken";
import { AuthRequest } from "../../middleware/authMiddleware";
const SENSITIVE_FIELDS = [
  "password",
  "emailVerificationToken",
  "emailVerificationTokenGeneratedTime",
  "otp",
  "otpGeneratedTime",
  "resetPasswordToken",
  "createdAt",
  "updatedAt"
] as const;

function sanitizeUser(user: InstanceType<typeof User>) {
  const json = user.toJSON() as Record<string, unknown>;
  for (const field of SENSITIVE_FIELDS) {
    delete json[field];
  }
  return json;
}
 
const normalizeEmail = (email: string) => email.trim().toLowerCase();

class AuthController {
  // *User Registration
  static async register(req: Request, res: Response) {
    try {
      const { username, email: rawEmail, password } = req.body;
      if (!username || !rawEmail || !password) {
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
      if (!emailRegex.test(rawEmail)) {
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

      const email = normalizeEmail(rawEmail);

      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        res.status(400).json({
          message: "Email already exists",
          field: "email",
        });
        return;
      }

      const generateEmailVerificationToken = generateOtp();

      console.log("Generated Email Verification Token:", generateEmailVerificationToken);
      const registerData = await User.create({
        username,
        email,
        password: await bcrypt.hash(password, 10),
        emailVerificationToken: generateEmailVerificationToken,
        emailVerificationTokenGeneratedTime: new Date(),
      });

      try{
      await sendVerificationEmailCode({
        email,
        subject: "Verify Your Truvora Email",
        code: generateEmailVerificationToken
      });
    } catch (mailError) {
  console.error("Welcome email failed to send:", mailError);
}

      const userWithoutSensitiveData = sanitizeUser(registerData);

      res.status(201).json({
        message: "User registered successfully! Please check your email for verification.",
        data: userWithoutSensitiveData,
      });
    } catch (error) {
      console.error("Error in register:", error);
      res.status(500).json({
        message: "Something went wrong",
      });
    }
  }

  // *Verify Email
  static async verifyEmail(req: Request, res: Response) {
    try {
    const { email: rawEmail, emailVerificationToken } = req.body;
    if (!rawEmail || !emailVerificationToken) {
      res.status(400).json({
        message: "Email and emailVerificationToken are required",
        field: "general",
      });
      return;
    }

    const email = normalizeEmail(rawEmail);
    const emailExist = await User.findOne({ where: { email } });
    if (!emailExist) {
      res.status(400).json({
        message: "User with this email does not exist",
        field: "email",
      });
      return;
    }

    if (emailExist.isVerified) {
      res.status(400).json({
        message: "Email is already verified",
        field: "email",
      });
      return;
    }

    if (emailExist.emailVerificationToken !== emailVerificationToken) {
      res.status(400).json({
        message: "Invalid email verification token",
        field: "emailVerificationToken",
      });
      return;
    }

    // Check if the email verification token has expired (4 minutes)
    const currentTime = Date.now();
    const emailVerificationTokenGeneratedTime = emailExist.emailVerificationTokenGeneratedTime?.getTime();
    const tokenAge = emailVerificationTokenGeneratedTime ? currentTime - emailVerificationTokenGeneratedTime : 0;
    const tokenExpiry = 4 * 60 * 1000; // 4 minutes in milliseconds
    if (tokenAge > tokenExpiry) {
      res.status(400).json({
        message: "Email verification token has expired",
        field: "emailVerificationToken",
      });
      return;
    }

    // Update the user's verification status
    await emailExist.update({ isVerified: true, emailVerificationToken: null, emailVerificationTokenGeneratedTime: null });

    res.status(200).json({
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Error in verifyEmail:", error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
  }

  // *Resend Verification Email
  static async resendVerificationEmail(req: Request, res: Response) {
    try {
      const { email: rawEmail } = req.body;
      if (!rawEmail) {
        res.status(400).json({
          message: "Email is required",
          field: "email",
        });
        return;
      }

      const email = normalizeEmail(rawEmail);
      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.status(400).json({
          message: "User with this email does not exist",
          field: "email",
        });
        return;
      }

      if (user.isVerified) {
        res.status(400).json({
          message: "Email is already verified",
          field: "email",
        });
        return;
      }

      const newVerificationToken = generateOtp();
      console.log("Generated New Email Verification Token:", newVerificationToken);
      user.emailVerificationToken = newVerificationToken;
      user.emailVerificationTokenGeneratedTime = new Date();
      await user.save();

      try {
        await sendVerificationEmailCode({
          email,
          subject: "Verify Your Truvora Email",
          code: newVerificationToken,
        });
      } catch (mailError) {
        console.error("Resend verification email failed to send:", mailError);
      }

      res.status(200).json({
        message: "A new verification code has been sent to your email.",
      });
    } catch (error) {
      console.error("Error in resendVerificationEmail:", error);
      res.status(500).json({
        message: "Something went wrong",
      });
    }
  }

  // *User Login
  static async login(req: Request, res: Response) {
    try {
      const { email: rawEmail, password } = req.body;
      const email = normalizeEmail(rawEmail);
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

      // Check if the user's email is verified
      if (!user.isVerified) {
        res.status(400).json({
          message: "Email is not verified. Please verify your email before logging in.",
          field: "email",
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(400).json({
          message: "Invalid password",
          field: "password",
        });
        return;
      }

      const token = generateToken(user.id, "1d");

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      try {
      await sendMail({
        to: email,
        subject: "Login Alert",
        text: `Hi ${user.username},\n\nWe noticed a login to your Truvora account. 
        If this was you, you can safely ignore this email. 
        If you did not log in, please secure your account immediately by changing your password and enabling two-factor authentication.\n\nBest regards,\nThe Truvora Team`,
      });
    } catch (mailError) {
  console.error("Login alert email failed to send:", mailError);
}

    const userWithoutSensitiveData = sanitizeUser(user);

      res.status(200).json({
        message: "User logged in successfully",
        data: userWithoutSensitiveData,
        token: token,
      });
    } catch (error) {
      console.error("Error in login:", error);
      res.status(500).json({
        message: "Something went wrong",
      });
    }
  }

  // *User Logout
  static logout(req: Request, res: Response) {
    try {
       res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      res.clearCookie("user", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      res.status(200).json({
        message: "User logged out successfully",
      });
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({
        message: "Something went wrong",
      });
    }
  }

  // *Forgot Password
  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email: rawEmail } = req.body;
      if (!rawEmail) {
        res.status(400).json({
          message: "Please provide your email",
          field: "email",
        });
        return;
      }

      const email = normalizeEmail(rawEmail);
      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.status(400).json({
          message: "Email is not registered",
          field: "email",
        });
        return;
      }

      const generatedOtp = generateOtp();

      user.otp = generatedOtp;
      user.otpGeneratedTime = new Date();
      await user.save();

      try {
      await sendMail({
        to: email,
        subject: "Password Reset OTP",
        text: `Your OTP for password reset is: ${generatedOtp}. It is valid for 4 minutes. If you did not request this, please ignore this email.`,
      });
    } catch (mailError) {
  console.error("Password reset OTP email failed to send:", mailError);
}

      res.status(200).json({
        message:
          "OTP sent to your email address for password reset. Please check your email.",
          email
      });
    } catch (error) {
      console.error("Error in forgotPassword:", error);
      res.status(500).json({
        message: "Something went wrong",
      });
    }
  }

  // *Verify OTP
  static async verifyOtp(req: Request, res: Response) {
    try {
    const { otp } = req.body;
    if (!otp) {
      res.status(400).json({
        message: "OTP is required",
        field: "otp",
      });
      return;
    }

    if (otp.length !== 6) {
      res.status(400).json({
        message: "OTP must be 6 digits long",
        field: "otp",
      });
      return;
    }

    // const [user] = await User.findAll({ where: { otp } });
    // if (!user) {
    //   res.status(400).json({
    //     message: "Invalid OTP",
    //     field: "otp"
    //   });
    //   return;
    // }

    // *OR
    const user = await findData(User, "otp", otp);
    if (!user) {
      res.status(400).json({
        message: "Invalid OTP",
        field: "otp",
      });
      return;
    }

    // const currentTime = Date.now();
    // const otpGeneratedTime = user.otpGeneratedTime?.getTime();
    // if (!otpGeneratedTime) {
    //   res.status(400).json({
    //     message: "Invalid OTP",
    //     field: "otp"
    //   });
    //   return;
    // }
    // const timeDifference = currentTime - otpGeneratedTime;
    // const otpValidityDuration = 4 * 60 * 1000;
    // if (timeDifference > otpValidityDuration) {
    //   res.status(400).json({
    //     message: "OTP has expired. Please request a new one.",
    //     field: "otp"
    //   });
    //   return;
    // }

    // *Or
    const checkOtpExpiration = isOtpExpired(
      user.otpGeneratedTime,
      4 * 60 * 1000,
    );
    if (checkOtpExpiration) {
      sendResponse(
        res,
        400,
        "OTP has expired. Please request a new one.",
        "otp",
        null,
        null,
      );
      return;
    }

    // Issue a short-lived token for password reset (valid for 4 minutes)
    const resetToken = generateToken(user.id, "4m");

    user.otp = null;
    user.otpGeneratedTime = null;
    user.resetPasswordToken = resetToken;
    await user.save();

    // res.status(200).json({
    //   message: "OTP verified successfully. You can now reset your password.",
    //   token: resetToken
    // });

    // *OR
    sendResponse(
      res,
      200,
      "OTP verified successfully. You can now reset your password.",
      null,
      [],
      resetToken,
    );
    } catch (error) {
      console.error("Error in verifyOtp:", error);
      res.status(500).json({
        message: "Something went wrong",
      });
    }
  }

  // *Reset Password
  static async resetPassword(req: Request, res: Response) {
    try {
      const { resetPasswordToken, newPassword, confirmNewPassword } = req.body;
      if (!resetPasswordToken || !newPassword || !confirmNewPassword) {
        res.status(400).json({
          message:
            "resetPasswordToken, newPassword and confirmNewPassword are required",
          field: "general",
        });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          message: "Password must be at least 8 characters long",
          field: "newPassword",
        });
        return;
      }

      if (newPassword !== confirmNewPassword) {
        res.status(400).json({
          message: "New password and confirm new password do not match",
          field: "confirmNewPassword",
        });
        return;
      }

      try {
        jwt.verify(resetPasswordToken, envConfig.jwtSecretKey as Secret);
      } catch {
        res.status(400).json({
          message: "Reset token has expired or is invalid",
          field: "resetPasswordToken",
        });
        return;
      }

      // verify reset token
      const user = await findData(
        User,
        "resetPasswordToken",
        resetPasswordToken,
      );
      if (!user) {
        res.status(400).json({
          message: "Invalid or expired reset token",
          field: "resetPasswordToken",
        });
        return;
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.resetPasswordToken = null;
      await user.save();
    
      try {
      await sendMail({
        to: user.email,
        subject: "Password Reset Successful",
        text: `Hi ${user.username},\n\nYour password has been reset successfully. If you did not perform this action, please contact our support team immediately.\n\nBest regards,\nThe Truvora Team`,
      });
    } catch (mailError) {
  console.error("Password reset confirmation email failed to send:", mailError);
}

      res.status(200).json({
        message: "Password reset successful",
      });
    } catch (error) {
      res.status(500).json({
        message: "Something went wrong",
      });
    }
  }

  // *Change Password (for logged in users)
  static async changePassword(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        res.status(401).json({
          message: "Unauthorized!",
          field: "general",
        });
        return;
      }

      const { currentPassword, newPassword, confirmNewPassword } = req.body;
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        res.status(400).json({
          message:
            "currentPassword, newPassword and confirmNewPassword are required",
          field: "general",
        });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          message: "New password must be at least 8 characters long",
          field: "newPassword",
        });
        return;
      }

      if (newPassword !== confirmNewPassword) {
        res.status(400).json({
          message: "New password and confirm new password do not match",
          field: "confirmNewPassword",
        });
        return;
      }

      const user = await User.findByPk(userId);
      if (!user) {
        res.status(404).json({
          message: "User not found",
        });
        return;
      }    
      
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          message: "Current password is incorrect",
          field: "currentPassword",
        });
        return;
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      res.status(200).json({
        message: "Password changed successfully",
      });
    }  catch (error) {
      console.error("Error in changePassword:", error);
      res.status(500).json({
        message: "Something went wrong",
      });
    }
  }
}

export default AuthController;
