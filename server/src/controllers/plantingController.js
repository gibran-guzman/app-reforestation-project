const plantingService = require('../services/plantingService');

const create = async (req, res, next) => {
  try {
    const planting = await plantingService.create(req.body, req.user.id);
    res.status(201).json({ message: 'Plántula registrada correctamente', data: planting });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const result = await plantingService.getAll(page, limit);
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

module.exports = { create, getAll, getById };
