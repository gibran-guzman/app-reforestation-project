const analyticsService = require('../services/analyticsService');
const { parseQueryFilters } = require('../utils/queryBuilder');
const { respond } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const getHeatmap = asyncHandler(async (req, res) => {
  const filters = parseQueryFilters(req.query);
  const result = await analyticsService.getHeatmap(filters);
  respond(res, result);
});

module.exports = { getHeatmap };
