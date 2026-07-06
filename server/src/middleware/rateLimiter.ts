// middleware/rateLimiter.ts
import rateLimit from "express-rate-limit";

// For OTP-guessing-sensitive endpoints (forgot-password, verify-otp)
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per window
  standardHeaders: true, // return RateLimit-* headers
  legacyHeaders: false, // disable X-RateLimit-* headers
  message: {
    message: "Too many attempts. Please try again after 15 minutes.",
    field: "general",
  },
});

// For reset-password (slightly more lenient, but still worth capping)
export const resetPasswordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many password reset attempts. Please try again after 15 minutes.",
    field: "general",
  },
});

// For login (looser — legitimate users mistype passwords more often than OTPs)
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  standardHeaders: true, // return RateLimit-* headers
  legacyHeaders: false, // disable X-RateLimit-* headers
  message: {
    message: "Too many login attempts. Please try again after 15 minutes.",
    field: "general",
  },
});

export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many accounts created from this IP. Please try again later.",
    field: "general",
  },
});
