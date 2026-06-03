const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');

router.get('/survival-rate', authenticate, reportsController.getSurvivalRate);
router.get('/species-stats', authenticate, reportsController.getSpeciesStats);
router.get('/zone-summary', authenticate, reportsController.getZoneSummary);
router.get('/export/pdf', authenticate, reportsController.exportPdf);
router.get('/planting-evolution', authenticate, reportsController.getPlantingEvolution);

module.exports = router;
