const speciesService = require('../services/speciesService');
const asyncHandler = require('../utils/asyncHandler');
const { respond } = require('../utils/response');
const parseId = require('../utils/parseId');

const createSpecies = asyncHandler(async (req, res) => {
  const species = await speciesService.createSpecies(req.body);
  respond(res, species, { status: 201, message: 'Especie registrada correctamente' });
});

const list = asyncHandler(async (req, res) => {
  const species = await speciesService.list();
  respond(res, species);
});

const getById = asyncHandler(async (req, res) => {
  const species = await speciesService.getById(parseId(req.params.id));
  respond(res, species);
});

const update = asyncHandler(async (req, res) => {
  const species = await speciesService.update(parseId(req.params.id), req.body);
  respond(res, species, { message: 'Especie actualizada correctamente' });
});

const remove = asyncHandler(async (req, res) => {
  await speciesService.remove(parseId(req.params.id));
  respond(res, null, { message: 'Especie eliminada correctamente' });
});

module.exports = { createSpecies, list, getById, update, remove };
