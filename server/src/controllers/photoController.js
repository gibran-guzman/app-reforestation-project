const photoService = require('../services/photoService');
const plantingRepository = require('../repositories/plantingRepository');
const { NotFoundError, AppError } = require('../errors/AppError');

const upload = async (req, res, next) => {
  try {
    const { id } = req.params;

    const planting = await plantingRepository.findById(id);
    if (!planting) {
      throw new NotFoundError('Plantación no encontrada');
    }

    if (!req.file) {
      throw new AppError('Debes seleccionar una imagen', 400);
    }

    const photoUrl = await photoService.uploadPhoto(id, req.file);

    const updated = await plantingRepository.updatePhotoUrl(id, photoUrl);

    res.json({ message: 'Foto subida correctamente', data: { photo_url: updated.photo_url } });
  } catch (error) {
    next(error);
  }
};

module.exports = { upload };
