const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// Disk storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate secure randomized filename: mosque-<timestamp>-<hex><ext>
    const ext = path.extname(file.originalname).toLowerCase();
    const randomHex = crypto.randomBytes(8).toString('hex');
    const safeFilename = `mosque-${Date.now()}-${randomHex}${ext}`;
    cb(null, safeFilename);
  }
});

// File filter: strict validation of MIME type and file extension
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    const err = new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
    err.statusCode = 400;
    return cb(err, false);
  }

  cb(null, true);
};

// Max file size: 5MB
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 Megabytes
  },
  fileFilter: fileFilter
});

module.exports = upload;
