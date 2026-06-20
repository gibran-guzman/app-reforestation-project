const monitoringService = require('../services/monitoringService');
const asyncHandler = require('../utils/asyncHandler');
const parseId = require('../utils/parseId');

const create = asyncHandler(async (req, res) => {
  const record = await monitoringService.create(req.body, req.user.id);
  res.status(201).json({ message: 'Monitoreo registrado correctamente', data: record });
});

const getByPlantingSiteId = asyncHandler(async (req, res) => {
  const records = await monitoringService.getByPlantingSiteId(parseId(req.params.plantingSiteId));
  res.json({ data: records });
});

const getById = asyncHandler(async (req, res) => {
  const record = await monitoringService.getById(parseId(req.params.id));
  res.json({ data: record });
});

module.exports = { create, getByPlantingSiteId, getById };
