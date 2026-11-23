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
import getFullImageUrl from "../../services/imageHandler";
import { emitToAdmin } from "../../services/socketService";
import { notifyNewCustomer } from "../../services/notificationService";
import { redeemLoginCode } from "../../services/googleAuth";
const SENSITIVE_FIELDS = [
  "password",
  "emailVerificationToken",
  "emailVerificationTokenGeneratedTime",
  "otp",
  "otpGeneratedTime",
  "resetPasswordToken",
  "passwordChangedAt",
  "pendingEmailCodeHash",
  "pendingEmailCodeAt",
  "createdAt",
  "updatedAt"
] as const;

export function sanitizeUser(user: InstanceType<typeof User>) {
  const json = user.toJSON() as Record<string, unknown>;
  for (const field of SENSITIVE_FIELDS) {
    delete json[field];
  }
  return json;
}
 
const normalizeEmail = (email: string) => email.trim().toLowerCase();

// Password-reset tokens are signed with their own key, so they can't be used as a login token
const resetTokenSecret = () => `${envConfig.jwtSecretKey}:password-reset`;

// Wrong reset codes per email; after MAX_OTP_ATTEMPTS the code is cancelled and a new one must be requested
const MAX_OTP_ATTEMPTS = 5;
const otpAttempts = new Map<string, number>();

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

      // Real-time notification for admin
      emitToAdmin("admin:user-registered", {
        userId: registerData.id,
        username: registerData.username,
        email: registerData.email,
        createdAt: registerData.createdAt,
      });
      emitToAdmin("admin:dashboard-refresh", {
        type: "user-registered",
        userId: registerData.id,
      });
      await notifyNewCustomer(registerData.id, registerData.username, registerData.email, "email");

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

      if (!user.password) {
        res.status(400).json({
          message: "This account signs in with Google. Use \"Continue with Google\", or set a password with Forgot password.",
          field: "password",
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

      if (user.isBlocked) {
        res.status(403).json({
          message: "This account has been blocked. Please contact the store if you think this is a mistake.",
          field: "general",
          code: "ACCOUNT_BLOCKED",
        });
        return;
      }

      const token = generateToken(user.id, "1h");

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1 * 60 * 60 * 1000, // 1 hour
      });

//       try {
//       await sendMail({
//         to: email,
//         subject: "Login Alert",
//         text: `Hi ${user.username},\n\nWe noticed a login to your Truvora account. 
//         If this was you, you can safely ignore this email. 
//         If you did not log in, please secure your account immediately by changing your password and enabling two-factor authentication.\n\nBest regards,\nThe Truvora Team`,
//       });
//     } catch (mailError) {
//   console.error("Login alert email failed to send:", mailError);
// }

    const userWithoutSensitiveData = sanitizeUser(user);

    // attach full avatarUrl
    const avatarUrl = user.avatar ? getFullImageUrl(user.avatar) : user.avatar;
    if (avatarUrl) {
      userWithoutSensitiveData.avatar = avatarUrl;
    }

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
      // Same answer whether or not the email has an account, so the form can't be used
      // to find out who shops here; only real accounts get an email
      if (!user) {
        res.status(200).json({
          message: "If an account exists for this email, we've sent it a reset code. Please check your inbox.",
          email,
        });
        return;
      }

      const generatedOtp = generateOtp();

      user.otp = generatedOtp;
      user.otpGeneratedTime = new Date();
      await user.save();
      otpAttempts.delete(email);

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
        message: "If an account exists for this email, we've sent it a reset code. Please check your inbox.",
        email,
      });
    } catch (error) {
      console.error("Error in forgotPassword:", error);
      res.status(500).json({
        message: "Something went wrong",
      });
    }
  }

  // *Swap the one-time code from the Google sign-in redirect for a login token
  static async exchangeGoogleCode(req: Request, res: Response) {
    const userId = redeemLoginCode(req.body?.code);
    const user = userId ? await User.findByPk(userId) : null;
    if (!user) {
      res.status(400).json({ message: "Google sign-in expired. Please try again.", field: "general" });
      return;
    }
    if (user.isBlocked) {
      res.status(403).json({
        message: "This account has been blocked. Please contact the store if you think this is a mistake.",
        field: "general",
        code: "ACCOUNT_BLOCKED",
      });
      return;
    }

    const token = generateToken(user.id, "1h");
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1 * 60 * 60 * 1000, // 1 hour
    });
    const data = sanitizeUser(user);
    if (user.avatar) data.avatar = getFullImageUrl(user.avatar);
    res.status(200).json({ message: "Signed in with Google", data, token });
  }

  // *Verify OTP
  static async verifyOtp(req: Request, res: Response) {
    try {
    const { otp, email: rawEmail } = req.body;
    if (!otp || typeof rawEmail !== "string" || !rawEmail.trim()) {
      res.status(400).json({
        message: "Email and OTP are required",
        field: "otp",
      });
      return;
    }

    if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      res.status(400).json({
        message: "OTP must be 6 digits long",
        field: "otp",
      });
      return;
    }
    const email = normalizeEmail(rawEmail);

    // const [user] = await User.findAll({ where: { otp } });
    // if (!user) {
    //   res.status(400).json({
    //     message: "Invalid OTP",
    //     field: "otp"
    //   });
    //   return;
    // }

    // The code must belong to this email (looking it up on its own would match any account's code)
    const user = await User.findOne({ where: { email } });
    if (!user || !user.otp || user.otp !== otp) {
      if (user?.otp) {
        const attempts = (otpAttempts.get(email) ?? 0) + 1;
        if (attempts >= MAX_OTP_ATTEMPTS) {
          otpAttempts.delete(email);
          user.otp = null;
          user.otpGeneratedTime = null;
          await user.save();
          res.status(400).json({
            message: "Too many wrong codes. Please request a new one.",
            field: "otp",
          });
          return;
        }
        otpAttempts.set(email, attempts);
      }
      res.status(400).json({
        message: "Invalid OTP",
        field: "otp",
      });
      return;
    }
    otpAttempts.delete(email);

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
    const resetToken = jwt.sign({ id: user.id, purpose: "password-reset" }, resetTokenSecret(), { expiresIn: "4m" });

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
        jwt.verify(resetPasswordToken, resetTokenSecret() as Secret);
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
      user.passwordChangedAt = new Date(); // signs out every device that was logged in
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
          field: "User"
        });
        return;
      }    
      
      if (!user.password) {
        res.status(400).json({
          message: "Your account signs in with Google and has no password yet. Use Forgot password on the login page to set one.",
          field: "currentPassword",
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
      user.passwordChangedAt = new Date(); // older login tokens (other devices) stop working
      await user.save();

      // This device stays signed in with a token issued after the change
      const token = generateToken(user.id, "1h");
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1 * 60 * 60 * 1000, // 1 hour
      });
      res.status(200).json({
        message: "Password changed. You've been signed out on your other devices.",
        token,
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
