require("dotenv").config();
import { NextFunction, Request, Response } from "express";
import { envConfig } from "../config/config";

const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// Configuration for Cloudinary
cloudinary.config({
  cloud_name: envConfig.cloudinaryCloudName,
  api_key: envConfig.cloudinaryApiKey,
  api_secret: envConfig.cloudinaryApiSecret,
});

const cloudinaryUpload = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      return next(); // If no file is provided, proceed to the next middleware
    }

    const uploadStream = await cloudinary.uploader.upload_stream(
      {
        folder: "Mern3_Ecommerce_Images",
        transformation: [{ width: 500, height: 500, crop: "limit" }],
      },
      (error: any, result: any) => {
        if (error) {
          console.log("Cloudinary Upload Error:", error);
          return res.status(500).json({ message: "Cloudinary Image upload failed", error });
        }

        // Attach the Cloudinary Result to the request object for further processing
        (req as any).cloudinaryResult = result;
        next();
      },
    );

    // Use streamifier to convert the buffer to a readable stream and pipe it to Cloudinary
    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (error) {
    console.error("Error in Cloudinary Upload Middleware:", error);
    res.status(500).json({ message: "Internal Server Error", error });
    next(error); // Pass the error to the next middleware for centralized error handling
  }
};

export { cloudinary, cloudinaryUpload };
