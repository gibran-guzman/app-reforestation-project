const monitoringService = require('../services/monitoringService');
const asyncHandler = require('../utils/asyncHandler');
const { respond, respondPaginated } = require('../utils/response');
const parseId = require('../utils/parseId');
const { DEFAULT_PAGE, MAX_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../config/constants');

const create = asyncHandler(async (req, res) => {
  const record = await monitoringService.create(req.body, req.user.id);
  respond(res, record, { status: 201, message: 'Monitoreo registrado correctamente' });
});

const getByPlantingSiteId = asyncHandler(async (req, res) => {
  const page = Math.min(MAX_PAGE, Math.max(DEFAULT_PAGE, parseInt(req.query.page, 10) || DEFAULT_PAGE));
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE));
  const { rows, total } = await monitoringService.getByPlantingSiteId(parseId(req.params.plantingSiteId), page, limit);
  respondPaginated(res, rows, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

const getById = asyncHandler(async (req, res) => {
  const record = await monitoringService.getById(parseId(req.params.id));
  respond(res, record);
});

module.exports = { create, getByPlantingSiteId, getById };
