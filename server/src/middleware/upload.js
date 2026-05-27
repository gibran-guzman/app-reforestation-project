const multer = require('multer');
const { AppError } = require('../errors/AppError');

const FILE_SIZE_LIMIT = 5 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Solo se permiten imágenes JPG, PNG o WebP', 400), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: FILE_SIZE_LIMIT } });

module.exports = upload;
