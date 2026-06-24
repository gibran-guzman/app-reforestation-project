const express = require('express');
const router = express.Router();
const plantingController = require('../controllers/plantingController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { validateCreatePlanting } = require('../validators/plantingValidator');

router.get('/', authenticate, plantingController.getAll);
router.get('/geojson', authenticate, plantingController.getGeoJson);
router.get('/:id', authenticate, plantingController.getById);
router.post('/', authenticate, authorize('admin', 'technician'), validate(validateCreatePlanting), plantingController.create);
router.post('/sync', authenticate, authorize('admin', 'technician'), plantingController.syncBatch);

module.exports = router;
