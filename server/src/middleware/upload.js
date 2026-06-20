const multer = require('multer');
const { AppError } = require('../errors/AppError');
const { FILE_SIZE_LIMIT_BYTES, ALLOWED_MIME_TYPES } = require('../config/constants');

const storage = multer.memoryStorage();

const MAGIC_BYTES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
};

const matchesMagicBytes = (buffer, expected) => {
  if (buffer.length < expected.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (buffer[i] !== expected[i]) return false;
  }
  return true;
};

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new AppError('Solo se permiten imágenes JPG, PNG o WebP', 400), false);
  }

  const expected = MAGIC_BYTES[file.mimetype];
  if (!expected || !matchesMagicBytes(file.buffer, expected)) {
    return cb(new AppError('El archivo no coincide con el formato de imagen declarado', 400), false);
  }

  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: FILE_SIZE_LIMIT_BYTES } });

module.exports = upload;
