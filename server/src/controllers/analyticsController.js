const analyticsService = require('../services/analyticsService');
const { parseQueryFilters } = require('../utils/queryBuilder');
const asyncHandler = require('../utils/asyncHandler');

const getHeatmap = asyncHandler(async (req, res) => {
  const filters = parseQueryFilters(req.query);
  const result = await analyticsService.getHeatmap(filters);
  res.json({ data: result });
});

module.exports = { getHeatmap };
