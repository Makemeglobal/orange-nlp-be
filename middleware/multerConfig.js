const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");

// ✅ Ensure the CSV folder exists
const csvUploadsDir = path.join(__dirname, "../uploads/csv");
if (!fs.existsSync(csvUploadsDir)) {
  fs.mkdirSync(csvUploadsDir, { recursive: true });
}

// ✅ Cloudinary storage (for images)
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",
    format: async (req, file) => file.mimetype.split("/")[1], // Detect format dynamically
    public_id: (req, file) => Date.now() + "-" + file.originalname,
  },
});

// ✅ Local storage (for CSV files)
const csvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, csvUploadsDir); // Ensure the directory exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// ✅ File filter for allowed file types
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else if (
    ["text/csv", "application/csv", "application/vnd.ms-excel"].includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type! Please upload an image or CSV file."), false);
  }
};

// ✅ Create separate multer instances
const upload = multer({
  storage: cloudinaryStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images are allowed!"), false);
  },
});

const uploadCSV = multer({
  storage: csvStorage,
  fileFilter: (req, file, cb) => {
    if (
      ["text/csv", "application/csv", "application/vnd.ms-excel"].includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed!"), false);
    }
  },
});

module.exports = { upload, uploadCSV };
