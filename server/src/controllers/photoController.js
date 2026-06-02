const photoService = require('../services/photoService');
const plantingService = require('../services/plantingService');
const { AppError } = require('../errors/AppError');

const upload = async (req, res, next) => {
  try {
    const { id } = req.params;

    await plantingService.getById(id);

    if (!req.file) {
      throw new AppError('Debes seleccionar una imagen', 400);
    }

    const photoUrl = await photoService.uploadPhoto(id, req.file);

    const updated = await plantingService.updatePhotoUrl(id, photoUrl);

    res.json({ message: 'Foto subida correctamente', data: { photo_url: updated.photo_url } });
  } catch (error) {
    next(error);
  }
};

module.exports = { upload };
