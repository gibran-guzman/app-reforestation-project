const photoService = require('../services/photoService');
const plantingService = require('../services/plantingService');
const { AppError } = require('../errors/AppError');
const { respond } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const parseId = require('../utils/parseId');
const logger = require('../utils/logger');

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

const validateFileContent = (file) => {
  const expected = MAGIC_BYTES[file.mimetype];
  if (!expected || !matchesMagicBytes(file.buffer, expected)) {
    throw new AppError('El archivo no coincide con el formato de imagen declarado', 400);
  }
};

const upload = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);

  if (!req.file) {
    throw new AppError('Debes seleccionar una imagen', 400);
  }

  validateFileContent(req.file);

  await plantingService.getById(id);

  const { publicUrl, filePath } = await photoService.uploadPhoto(id, req.file);

  try {
    const updated = await plantingService.updatePhotoUrl(id, publicUrl);
    respond(res, { photo_url: updated.photo_url }, { message: 'Foto subida correctamente' });
  } catch (error) {
    try {
      await photoService.deletePhoto(filePath);
    } catch (cleanupError) {
      logger.error({ cleanupError, filePath }, 'Error al limpiar foto tras fallo de actualización');
    }
    throw error;
  }
});

module.exports = { upload };
