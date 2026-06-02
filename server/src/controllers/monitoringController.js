const monitoringService = require('../services/monitoringService');

const create = async (req, res, next) => {
  try {
    const record = await monitoringService.create(req.body, req.user.id);
    res.status(201).json({ message: 'Monitoreo registrado correctamente', data: record });
  } catch (error) {
    next(error);
  }
};

const getByPlantingSiteId = async (req, res, next) => {
  try {
    const records = await monitoringService.getByPlantingSiteId(req.params.plantingSiteId);
    res.json({ data: records });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const record = await monitoringService.getById(req.params.id);
    res.json({ data: record });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getByPlantingSiteId, getById };
