const monitoringService = require('../services/monitoringService');
const asyncHandler = require('../utils/asyncHandler');
const { respond } = require('../utils/response');
const parseId = require('../utils/parseId');

const create = asyncHandler(async (req, res) => {
  const record = await monitoringService.create(req.body, req.user.id);
  respond(res, record, { status: 201, message: 'Monitoreo registrado correctamente' });
});

const getByPlantingSiteId = asyncHandler(async (req, res) => {
  const records = await monitoringService.getByPlantingSiteId(parseId(req.params.plantingSiteId));
  respond(res, records);
});

const getById = asyncHandler(async (req, res) => {
  const record = await monitoringService.getById(parseId(req.params.id));
  respond(res, record);
});

module.exports = { create, getByPlantingSiteId, getById };
