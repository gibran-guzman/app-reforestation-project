const multer = require('multer');
const { AppError } = require('../errors/AppError');
const { FILE_SIZE_LIMIT_BYTES, ALLOWED_MIME_TYPES } = require('../config/constants');

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new AppError('Solo se permiten imágenes JPG, PNG o WebP', 400), false);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: FILE_SIZE_LIMIT_BYTES } });

module.exports = { upload, ALLOWED_MIME_TYPES };
