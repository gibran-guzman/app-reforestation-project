const speciesService = require('../services/speciesService');

const createSpecies = async (req, res, next) => {
  try {
    const result = await speciesService.createSpecies(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const species = await speciesService.list();
    res.json({ data: species });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const species = await speciesService.getById(Number(req.params.id));
    res.json({ data: species });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const species = await speciesService.update(Number(req.params.id), req.body);
    res.json({ message: 'Especie actualizada correctamente', data: species });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await speciesService.remove(Number(req.params.id));
    res.json({ message: 'Especie eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createSpecies, list, getById, update, remove };
