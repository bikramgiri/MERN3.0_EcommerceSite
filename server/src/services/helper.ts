const fs = require("fs");
const path = require("path");
import crypto from 'crypto';

// Helper: delete image file from disk
const deleteImageFromDisk = (filename: string | undefined | null) => {
  if (!filename) return;
  const imagePath = path.join(__dirname, "../storage", filename);
  fs.unlink(imagePath, (err: NodeJS.ErrnoException | null) => {
if (err && err.code !== "ENOENT") {
      console.error("Failed to delete image:", err);
    }
  });
};

export default deleteImageFromDisk;

// Helper: generate HMAC SHA256 hash
const generateHmacSha256Hash = (data: string, secret: string): string => {
  if (!data || !secret) {
    throw new Error("Both data and secret are required to generate a hash.");
  }
  return crypto.createHmac("sha256", secret).update(data).digest("base64");
};

export { generateHmacSha256Hash };