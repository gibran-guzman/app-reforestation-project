const plantingService = require('../services/plantingService');

const create = async (req, res, next) => {
  try {
    const planting = await plantingService.create(req.body, req.user.id);
    res.status(201).json({ message: 'Plántula registrada correctamente', data: planting });
  } catch (error) {
    next(error);
  }
};

const syncBatch = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Se requiere un arreglo items con al menos un elemento' });
    }
    const results = await plantingService.syncBatch(items, req.user.id);
    res.json({ data: results });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const filters = {};
    if (req.query.zone_id) filters.zone_id = parseInt(req.query.zone_id, 10);
    if (req.query.species_id) filters.species_id = parseInt(req.query.species_id, 10);
    if (req.query.from) filters.from = req.query.from;
    if (req.query.to) filters.to = req.query.to;
    const result = await plantingService.getAll(page, limit, filters);
    res.json({
      data: result.rows,
      meta: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const planting = await plantingService.getById(req.params.id);
    res.json({ data: planting });
  } catch (error) {
    next(error);
  }
};

const getGeoJson = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.zone_id) filters.zone_id = parseInt(req.query.zone_id, 10);
    if (req.query.species_id) filters.species_id = parseInt(req.query.species_id, 10);
    if (req.query.from) filters.from = req.query.from;
    if (req.query.to) filters.to = req.query.to;
    const geojson = await plantingService.getGeoJson(filters);
    res.json(geojson);
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getById, syncBatch, getGeoJson };
