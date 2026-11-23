import express, { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { connectDB } from './database/connection';
import apiRoutes from './routes/api';
import cors from 'cors';

// Local dev ports plus the live storefront address from CLIENT_URL in .env
export const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL.replace(/\/$/, "")] : []),
];

const app = express();

// Basic security headers: don't advertise Express, no MIME sniffing, no framing (clickjacking)
app.disable("x-powered-by");
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}))

// Google Login
import session from 'express-session';
import { envConfig } from './config/config';
app.use(session({
  secret: envConfig.sessionSecret as string,
  resave: false,
  saveUninitialized: false, // only the Google sign-in handshake needs a session
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days
  }
}));
import googleAuth from './services/googleAuth';
app.use(googleAuth.passport.initialize());
app.use(googleAuth.passport.session());

// Behind a host's proxy (Render, Railway, Nginx) req.ip would be the proxy for everyone, so the
// rate limiters would lump all visitors together. TRUST_PROXY=<number of proxies> overrides the default.
if (process.env.TRUST_PROXY || process.env.NODE_ENV === "production") {
  app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1);
}

// *Route
app.use("/api", apiRoutes)

// *Give access to storage folder images
app.use("/src/storage", express.static(path.join(process.cwd(), "src", "storage")));
app.use("/src/storage", express.static(path.join(__dirname, "storage")));
app.use("/storage", express.static(path.join(process.cwd(), "src", "storage")));

// Unknown API paths answer in JSON instead of Express's HTML page
app.use("/api", (req: Request, res: Response) => {
  res.status(404).json({ message: "Not found" });
});

// Last stop for errors passed to next(): uploads (size/type), bad JSON bodies, anything unexpected.
// Never sends stack traces or internal details to the client.
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;
  if (err instanceof multer.MulterError) {
    const tooBig = err.code === "LIMIT_FILE_SIZE";
    res.status(400).json({ message: tooBig ? "The image must be 10 MB or smaller." : "That file couldn't be uploaded.", field: err.field || "file" });
    return;
  }
  const status = (err as { status?: number; statusCode?: number })?.status ?? (err as { statusCode?: number })?.statusCode;
  if (status === 400 && (err as { type?: string })?.type === "entity.parse.failed") {
    res.status(400).json({ message: "The request body isn't valid JSON." });
    return;
  }
  if (err instanceof Error && /file type is not supported/i.test(err.message)) {
    res.status(400).json({ message: err.message, field: "file" });
    return;
  }
  if (status === 413) {
    res.status(413).json({ message: "The request is too large." });
    return;
  }
  console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json({ message: "Something went wrong" });
});

// *Database connection
// connectDB();
// OR
// import './database/connection';

// Export an init function that resolves once DB is ready
export const initApp = async () => {
  await connectDB();
  return app;
};

export default app;

