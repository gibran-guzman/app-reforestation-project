const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');
const { parseQueryFilters } = require('../utils/queryBuilder');
const { validateReportFilters } = require('../validators/reportsValidator');
const asyncHandler = require('../utils/asyncHandler');

const parseFilters = asyncHandler((req, _res, next) => {
  req.filters = parseQueryFilters(req.query);
  validateReportFilters(req.filters);
  next();
});

router.get('/survival-rate', authenticate, parseFilters, reportsController.getSurvivalRate);
router.get('/species-stats', authenticate, parseFilters, reportsController.getSpeciesStats);
router.get('/zone-summary', authenticate, parseFilters, reportsController.getZoneSummary);
router.get('/export/pdf', authenticate, parseFilters, reportsController.exportPdf);
router.get('/planting-evolution', authenticate, parseFilters, reportsController.getPlantingEvolution);

module.exports = router;
