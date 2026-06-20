const zoneService = require('../services/zoneService');
const asyncHandler = require('../utils/asyncHandler');
const parseId = require('../utils/parseId');

const list = asyncHandler(async (req, res) => {
  const zones = await zoneService.list();
  res.json({ data: zones });
});

const getById = asyncHandler(async (req, res) => {
  const zone = await zoneService.getById(parseId(req.params.id));
  res.json({ data: zone });
});

const create = asyncHandler(async (req, res) => {
  const zone = await zoneService.create(req.body);
  res.status(201).json({ message: 'Zona de intervención creada correctamente', data: zone });
});

const update = asyncHandler(async (req, res) => {
  const zone = await zoneService.update(parseId(req.params.id), req.body);
  res.json({ message: 'Zona de intervención actualizada correctamente', data: zone });
});

const remove = asyncHandler(async (req, res) => {
  await zoneService.remove(parseId(req.params.id));
  res.json({ message: 'Zona de intervención eliminada correctamente', data: null });
});

module.exports = { list, getById, create, update, remove };
