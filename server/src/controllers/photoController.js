const photoService = require('../services/photoService');
const plantingService = require('../services/plantingService');
const { AppError } = require('../errors/AppError');
const asyncHandler = require('../utils/asyncHandler');
const parseId = require('../utils/parseId');
const logger = require('../utils/logger');

const upload = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);

  if (!req.file) {
    throw new AppError('Debes seleccionar una imagen', 400);
  }

  await plantingService.getById(id);

  const { publicUrl, filePath } = await photoService.uploadPhoto(id, req.file);

  try {
    const updated = await plantingService.updatePhotoUrl(id, publicUrl);
    res.json({ message: 'Foto subida correctamente', data: { photo_url: updated.photo_url } });
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
