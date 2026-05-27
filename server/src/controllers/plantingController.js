const plantingService = require('../services/plantingService');

const create = async (req, res, next) => {
  try {
    const planting = await plantingService.create(req.body, req.user.id);
    res.status(201).json({ message: 'Plántula registrada correctamente', data: planting });
  } catch (error) {
    next(error);
  }
};

module.exports = { create };
