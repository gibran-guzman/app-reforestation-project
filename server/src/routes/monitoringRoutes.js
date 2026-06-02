const express = require('express');
const router = express.Router();
const monitoringController = require('../controllers/monitoringController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/planting/:plantingSiteId', authenticate, monitoringController.getByPlantingSiteId);
router.get('/:id', authenticate, monitoringController.getById);
router.post('/', authenticate, authorize('admin', 'technician'), monitoringController.create);

module.exports = router;
