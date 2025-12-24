// /utils/cloudinary.js
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer to Cloudinary.
 * Automatically sets resource_type to 'raw' for non-images (PDF/DOC, etc).
 */
function uploadBuffer(buffer, options = {}, mimetype = "image/jpeg") {
  return new Promise((resolve, reject) => {
    // Auto-detect PDFs / non-image files
    const isPdfOrDoc =
      mimetype.includes("pdf") ||
      mimetype.includes("msword") ||
      mimetype.includes("officedocument");

    const uploadOptions = {
      resource_type: isPdfOrDoc ? "raw" : "auto",
      folder: options.folder || "airbnb/uploads",
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

module.exports = { cloudinary, uploadBuffer };
