const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');
const validateQuery = require('../middleware/validateQuery');
const { parseAndValidateReportFilters } = require('../validators/reportsValidator');

router.get('/survival-rate', authenticate, validateQuery(parseAndValidateReportFilters), reportsController.getSurvivalRate);
router.get('/species-stats', authenticate, validateQuery(parseAndValidateReportFilters), reportsController.getSpeciesStats);
router.get('/zone-summary', authenticate, validateQuery(parseAndValidateReportFilters), reportsController.getZoneSummary);
router.get('/export/pdf', authenticate, validateQuery(parseAndValidateReportFilters), reportsController.exportPdf);
router.get('/planting-evolution', authenticate, validateQuery(parseAndValidateReportFilters), reportsController.getPlantingEvolution);

module.exports = router;
