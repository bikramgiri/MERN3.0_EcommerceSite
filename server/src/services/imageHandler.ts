// import { envConfig } from "../config/config";

// // Helper to get full URL from stored filename
// function getFullImageUrl(fileName: string | undefined): string {
//   if (!fileName) {
//     return "/placeholder.jpg";
//   }
//    return `${envConfig.cloudinaryBaseUrl}${fileName}`;
// }

// export default getFullImageUrl;



// services/imageHandler.ts
import { cloudinary } from "../cloudinary";

function getFullImageUrl(publicId: string | undefined): string {
  if (!publicId) {
    return "/placeholder.jpg";
  }

  return cloudinary.url(publicId, {
    secure: true,
  });
}

export default getFullImageUrl;
