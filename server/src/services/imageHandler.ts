import { envConfig } from "../config/config";

// Helper to get full URL from stored filename
function getFullImageUrl(fileName: string | undefined): string {
  if (!fileName) {
    return "/placeholder.jpg";
  }
   return `${envConfig.cloudinaryBaseUrl}${fileName}`;
}

export default getFullImageUrl;
