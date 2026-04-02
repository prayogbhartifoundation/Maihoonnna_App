const multer = require('multer');

// Use memory storage since we're passing buffers to the storage service directly
const storage = multer.memoryStorage();

// Validate file types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, and PDF are allowed.`), false);
  }
};

// 5MB limit
const limits = {
  fileSize: 5 * 1024 * 1024
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits
});

module.exports = upload;
