// services/cloudinaryHelper.ts
export function getPublicIdFromAvatar(avatar: string): string {
// input example: "https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg"
  if (!avatar) return ""; // Return an empty string if the avatar is null or undefined

  // Already a bare public_id (no protocol, no "/upload/" segment)
  if (!avatar.startsWith("http")) { // If the avatar doesn't start with "http", it's likely already a public_id
    return avatar; // Return the avatar as is, assuming it's already a public_id
  }

  // Legacy case: a full Cloudinary URL — extract the public_id from it
  const afterUpload = avatar.split("/upload/")[1];  // Get the part after "/upload/", example: "v1234567890/sample.jpg"
  if (!afterUpload) return ""; // Return an empty string if the split didn't yield a valid part

  const withoutVersion = afterUpload.replace(/^v\d+\//, "");// Remove the version prefix (e.g., "v1234567890/"), example: "sample.jpg"
  const withoutExtension = withoutVersion.replace(/\.[^/.]+$/, ""); // Remove the file extension (e.g., ".jpg"), example: "sample"

  return withoutExtension;
}
