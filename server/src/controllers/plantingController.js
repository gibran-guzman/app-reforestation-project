const plantingService = require('../services/plantingService');
const { parseQueryFilters } = require('../utils/queryBuilder');
const asyncHandler = require('../utils/asyncHandler');
const { respond, respondPaginated } = require('../utils/response');
const parseId = require('../utils/parseId');
const { MAX_BATCH_ITEMS, DEFAULT_PAGE, MAX_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../config/constants');

const create = asyncHandler(async (req, res) => {
  const planting = await plantingService.create(req.body, req.user.id);
  respond(res, planting, { status: 201, message: 'Plántula registrada correctamente' });
});

const syncBatch = asyncHandler(async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Se requiere un arreglo de elementos con al menos un ítem' });
  }
  if (items.length > MAX_BATCH_ITEMS) {
    return res.status(400).json({ error: `Máximo ${MAX_BATCH_ITEMS} registros por lote` });
  }
  const results = await plantingService.syncBatch(items, req.user.id);
  respond(res, results);
});

const getAll = asyncHandler(async (req, res) => {
  const page = Math.min(MAX_PAGE, Math.max(DEFAULT_PAGE, parseInt(req.query.page, 10) || DEFAULT_PAGE));
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE));
  const filters = parseQueryFilters(req.query);
  const result = await plantingService.getAll(page, limit, filters);
  respondPaginated(res, result.rows, { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) });
});

const getById = asyncHandler(async (req, res) => {
  const planting = await plantingService.getById(parseId(req.params.id));
  respond(res, planting);
});

const getGeoJson = asyncHandler(async (req, res) => {
  const filters = parseQueryFilters(req.query);
  const geojson = await plantingService.getGeoJson(filters);
  res.json(geojson);
});

module.exports = { create, getAll, getById, syncBatch, getGeoJson };
