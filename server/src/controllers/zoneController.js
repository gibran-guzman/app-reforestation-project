const zoneService = require('../services/zoneService');
const asyncHandler = require('../utils/asyncHandler');
const { respond } = require('../utils/response');
const parseId = require('../utils/parseId');

const list = asyncHandler(async (req, res) => {
  const zones = await zoneService.list();
  respond(res, zones);
});

const getById = asyncHandler(async (req, res) => {
  const zone = await zoneService.getById(parseId(req.params.id));
  respond(res, zone);
});

const create = asyncHandler(async (req, res) => {
  const zone = await zoneService.create(req.body);
  respond(res, zone, { status: 201, message: 'Zona de intervención creada correctamente' });
});

const update = asyncHandler(async (req, res) => {
  const zone = await zoneService.update(parseId(req.params.id), req.body);
  respond(res, zone, { message: 'Zona de intervención actualizada correctamente' });
});

const remove = asyncHandler(async (req, res) => {
  await zoneService.remove(parseId(req.params.id));
  respond(res, null, { message: 'Zona de intervención eliminada correctamente' });
});

module.exports = { list, getById, create, update, remove };
