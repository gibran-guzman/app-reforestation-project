const express = require('express');
const router = express.Router();
const zoneController = require('../controllers/zoneController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, zoneController.list);
router.get('/:id', authenticate, zoneController.getById);
router.post('/', authenticate, authorize('admin'), zoneController.create);
router.put('/:id', authenticate, authorize('admin'), zoneController.update);
router.delete('/:id', authenticate, authorize('admin'), zoneController.remove);

module.exports = router;
