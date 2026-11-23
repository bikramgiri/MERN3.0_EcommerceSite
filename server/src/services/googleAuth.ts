import crypto from "crypto";
import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import User from "../database/models/userModel";
import { envConfig } from "../config/config";
import { emitToAdmin } from "./socketService";
import { notifyNewCustomer } from "./notificationService";
const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

/** Where the shop runs (CLIENT_URL); redirects after Google sign-in go here */
export const clientUrl = () => (envConfig.clientUrl || "http://localhost:5173").replace(/\/$/, "");

// One-time codes handed to the shop after Google sign-in; the shop swaps one for a login token.
// Works when the shop and the API are on different domains (cookies set by the API can't be read there).
const LOGIN_CODE_TTL_MS = 60 * 1000;
const loginCodes = new Map<string, { userId: string; expiresAt: number }>();

const issueLoginCode = (userId: string) => {
  const now = Date.now();
  for (const [code, entry] of loginCodes) if (entry.expiresAt < now) loginCodes.delete(code);
  const code = crypto.randomBytes(32).toString("hex");
  loginCodes.set(code, { userId, expiresAt: now + LOGIN_CODE_TTL_MS });
  return code;
};

/** Returns the user id for a valid code and forgets the code (each one works once) */
export const redeemLoginCode = (code: unknown): string | null => {
  if (typeof code !== "string") return null;
  const entry = loginCodes.get(code);
  loginCodes.delete(code);
  return entry && entry.expiresAt >= Date.now() ? entry.userId : null;
};

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
          password: null, // Google accounts sign in without a password (one can be set via Forgot password)
          isVerified: true, // Google has already confirmed the email address
        });

        emitToAdmin("admin:user-registered", {
          userId: user.id,
          username: user.username,
          email: user.email,
          provider: "google",
          createdAt: user.createdAt,
        });
        emitToAdmin("admin:dashboard-refresh", {
          type: "user-registered",
          userId: user.id,
        });
        await notifyNewCustomer(user.id, user.username, user.email, "Google");
      } else if (!user.googleId) {
        // Link existing account
        user.googleId = googleId;
        user.avatar = avatar || user.avatar;
        if (!user.isVerified) {
          // Nobody proved they own this email before; the password chosen at sign-up could be
          // someone else's, so it's dropped now that Google confirms the real owner
          user.isVerified = true;
          user.password = null;
        }
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
    const user = req.user as User | undefined; // Passport sets req.user to the signed-in user
    if (!user) {
      throw new Error("User not found after authentication");
    }
    if (user.isBlocked) {
      res.redirect(`${clientUrl()}/login?error=account_blocked`);
      return;
    }
    // The shop exchanges this short-lived code for a login token (POST /api/auth/google/exchange)
    res.redirect(`${clientUrl()}/?googleCode=${issueLoginCode(user.id)}`);
  } catch (error) {
    console.error("Error during Google OAuth callback:", error);
    res.redirect(`${clientUrl()}/login?error=google_login_failed`);
  }
};

export default { passport, googleAuthCallback };