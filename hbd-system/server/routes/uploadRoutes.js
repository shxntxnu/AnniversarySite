const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Ensure upload directory exists
if (!fs.existsSync(config.paths.uploadsDir)) {
  fs.mkdirSync(config.paths.uploadsDir, { recursive: true });
}

// Multer disk storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.paths.uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueName = `${cleanBase}_${Date.now()}${ext || '.jpg'}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif|heic/i;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype.toLowerCase();

  if (allowed.test(ext) || allowed.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG, WebP, GIF) are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  }
});

// All uploads require authentication and admin privileges
router.use(requireAuth);
router.use(requireAdmin);

// POST /api/upload - Single or multiple file upload (admin only)
router.post('/', upload.array('photos', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files were uploaded'
      });
    }

    const uploadedUrls = [];

    // Optional Cloudinary upload support
    const hasCloudinary = Boolean(
      config.cloudinary.cloudName &&
      config.cloudinary.apiKey &&
      config.cloudinary.apiSecret
    );

    if (hasCloudinary) {
      try {
        const cloudinary = require('cloudinary').v2;
        cloudinary.config({
          cloud_name: config.cloudinary.cloudName,
          api_key: config.cloudinary.apiKey,
          api_secret: config.cloudinary.apiSecret
        });

        for (const file of req.files) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'birthday_memories'
          });
          uploadedUrls.push(result.secure_url);
        }

        return res.json({
          success: true,
          provider: 'cloudinary',
          urls: uploadedUrls,
          url: uploadedUrls[0]
        });
      } catch (cloudErr) {
        console.warn('Cloudinary upload failed, falling back to local files:', cloudErr.message);
        // Fallback to local files if Cloudinary fails
      }
    }

    // Local file URLs
    for (const file of req.files) {
      uploadedUrls.push(`/uploads/${file.filename}`);
    }

    return res.json({
      success: true,
      provider: 'local',
      urls: uploadedUrls,
      url: uploadedUrls[0]
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
