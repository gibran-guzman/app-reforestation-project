const express = require('express');
const router = express.Router();
const monitoringController = require('../controllers/monitoringController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { validateCreateMonitoring } = require('../validators/monitoringValidator');

router.get('/planting/:plantingSiteId', authenticate, monitoringController.getByPlantingSiteId);
router.get('/:id', authenticate, monitoringController.getById);
router.post('/', authenticate, authorize('admin', 'technician'), validate(validateCreateMonitoring), monitoringController.create);

module.exports = router;
