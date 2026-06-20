const speciesService = require('../services/speciesService');
const asyncHandler = require('../utils/asyncHandler');
const parseId = require('../utils/parseId');

const createSpecies = asyncHandler(async (req, res) => {
  const species = await speciesService.createSpecies(req.body);
  res.status(201).json({ message: 'Especie registrada correctamente', data: species });
});

const list = asyncHandler(async (req, res) => {
  const species = await speciesService.list();
  res.json({ data: species });
});

const getById = asyncHandler(async (req, res) => {
  const species = await speciesService.getById(parseId(req.params.id));
  res.json({ data: species });
});

const update = asyncHandler(async (req, res) => {
  const species = await speciesService.update(parseId(req.params.id), req.body);
  res.json({ message: 'Especie actualizada correctamente', data: species });
});

const remove = asyncHandler(async (req, res) => {
  await speciesService.remove(parseId(req.params.id));
  res.json({ message: 'Especie eliminada correctamente', data: null });
});

module.exports = { createSpecies, list, getById, update, remove };
