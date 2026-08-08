const photoService = require('../services/photoService');
const plantingService = require('../services/plantingService');
const { AppError } = require('../errors/AppError');
const { respond } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const parseId = require('../utils/parseId');
const logger = require('../utils/logger');

const MAGIC_BYTES = {
  'image/jpeg': [{ offset: 0, bytes: [0xFF, 0xD8, 0xFF] }],
  'image/png': [{ offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }],
  'image/webp': [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  ],
};

const matchesSignature = (buffer, { offset, bytes }) => {
  if (buffer.length < offset + bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (buffer[offset + i] !== bytes[i]) return false;
  }
  return true;
};

const validateFileContent = (file) => {
  const signatures = MAGIC_BYTES[file.mimetype];
  if (!signatures || !signatures.every((sig) => matchesSignature(file.buffer, sig))) {
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

  const { filePath } = await photoService.uploadPhoto(id, req.file);

  try {
    const updated = await plantingService.updatePhotoUrl(id, filePath);
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
