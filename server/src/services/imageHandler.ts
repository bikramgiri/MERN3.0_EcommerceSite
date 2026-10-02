// import { envConfig } from "../config/config";

// // Helper to get full URL from stored filename
// function getFullImageUrl(fileName: string | undefined): string {
//   if (!fileName) {
//     return "/placeholder.jpg";
//   }
//    return `${envConfig.cloudinaryBaseUrl}${fileName}`;
// }

// export default getFullImageUrl;



import { cloudinary } from "../cloudinary";
import { envConfig } from "../config/config";
import fs from "fs";
import path from "path";

function getFullImageUrl(imagePath: string | undefined): string {
  if (!imagePath || typeof imagePath !== "string" || imagePath.trim() === "") {
    return "/placeholder.jpg";
  }

  const cleanPath = imagePath.trim();

  // If already an absolute HTTP or HTTPS URL (e.g. Google avatar or external link)
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    return cleanPath;
  }

  // Check if it exists in local storage directory
  const backendBase = envConfig.backendUrl || "http://localhost:4000";
  const srcStorageFile = path.join(process.cwd(), "src", "storage", cleanPath);
  const dirStorageFile = path.join(__dirname, "storage", cleanPath);
  const parentStorageFile = path.join(__dirname, "..", "storage", cleanPath);

  if (
    fs.existsSync(srcStorageFile) ||
    fs.existsSync(dirStorageFile) ||
    fs.existsSync(parentStorageFile) ||
    (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(cleanPath) && !cleanPath.includes("/"))
  ) {
    return `${backendBase}/src/storage/${cleanPath}`;
  }

  // Otherwise, treat as Cloudinary public ID (e.g. Mern3_Ecommerce_Images/...)
  return cloudinary.url(cleanPath, {
    secure: true,
  });
}

export default getFullImageUrl;
