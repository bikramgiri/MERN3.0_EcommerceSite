import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import generateToken from "./generateToken";
import User from "../database/models/userModel";
import { envConfig } from "../config/config";
const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const jwt = require("jsonwebtoken");

passport.serializeUser(function(user: any, cb: any) {
  cb(null, user.id); // Serialize only the user ID
});

passport.deserializeUser(async function(id: string, cb: any) {
  try {
    const user = await User.findByPk(id);
    cb(null, user);
  } catch (err) {
    cb(err);
  }
});

passport.use(new GoogleStrategy({
    clientID: envConfig.googleClientId,
    clientSecret: envConfig.googleClientSecret,
    callbackURL: "/api/auth/google/callback"
  },
  
  async function(accessToken: string, refreshToken: string, profile: any, done: any) {
    try {
      const userGoogleEmail = profile.emails[0].value;
      const googleId = profile.id;
      const username = profile.displayName;
      const avatar = profile.photos[0].value;

      let user = await User.findOne({ where: { googleId } });

      if (!user) {
        user = await User.findOne({ where: { email: userGoogleEmail } });
      }

      if (!user) {
        // Create new user
        user = await User.create({
          username,
          email: userGoogleEmail,
          googleId,
          avatar,
          // No password needed for Google auth users
        });
      } else if (!user.googleId) {
        // Link existing account
        user.googleId = googleId;
        user.avatar = avatar || user.avatar;
        await user.save();
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

const googleAuthCallback = async function (req: AuthRequest, res: Response) {
  try {
    const user = req.user as any;  // Passport sets req.user to the deserialized user

    if (!user) {
      throw new Error("User not found after authentication");
    }

    // Generate JWT token
    const token = generateToken(user.id, "1d");
//     console.log("Generated token payload:", jwt.decode(token));

  // Clear any old/wrong cookies first
    res.clearCookie("token");
    res.clearCookie("user");

    // Set httpOnly cookie
    res.cookie("token", token, {
      httpOnly: false, 
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });
    res.cookie("user", JSON.stringify(user.toJSON()), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend with success flag (avoid sending token in query for security)
    res.redirect(`http://localhost:5173?loginSuccess=true`);
  } catch (error) {
    console.error("Error during Google OAuth callback:", error);
    res.redirect("http://localhost:5173/login?error=google_login_failed");
  }
}

export default { passport, googleAuthCallback };