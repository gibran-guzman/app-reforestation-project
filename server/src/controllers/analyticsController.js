const analyticsService = require('../services/analyticsService');

const getHeatmap = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.zone_id) filters.zone_id = parseInt(req.query.zone_id, 10);
    if (req.query.species_id) filters.species_id = parseInt(req.query.species_id, 10);
    if (req.query.from) filters.from = req.query.from;
    if (req.query.to) filters.to = req.query.to;
    if (req.query.interval) filters.interval = req.query.interval;
    const result = await analyticsService.getHeatmap(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getHeatmap };
