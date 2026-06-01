const zoneService = require('../services/zoneService');

const list = async (req, res, next) => {
  try {
    const zones = await zoneService.list();
    res.json({ data: zones });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const zone = await zoneService.getById(Number(req.params.id));
    res.json({ data: zone });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const zone = await zoneService.create(req.body);
    res.status(201).json({ message: 'Zona de intervención creada correctamente', data: zone });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const zone = await zoneService.update(Number(req.params.id), req.body);
    res.json({ message: 'Zona de intervención actualizada correctamente', data: zone });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await zoneService.remove(Number(req.params.id));
    res.json({ message: 'Zona de intervención eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = { list, getById, create, update, remove };
