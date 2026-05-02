const fs = require("fs");
const path = require("path");

// Helper: delete image file from disk
const deleteImageFromDisk = (filename: string | undefined) => {
  if (!filename) return;
  const imagePath = path.join(__dirname, "../storage", filename);
  fs.unlink(imagePath, (err: NodeJS.ErrnoException | null) => {
    if (err) console.error("Failed to delete image:", err);
  });
};

export default deleteImageFromDisk;
