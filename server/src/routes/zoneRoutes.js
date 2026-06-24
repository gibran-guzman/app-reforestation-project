const express = require('express');
const router = express.Router();
const zoneController = require('../controllers/zoneController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { validateCreateZone, validateUpdateZone } = require('../validators/zoneValidator');

router.get('/', authenticate, zoneController.list);
router.get('/:id', authenticate, zoneController.getById);
router.post('/', authenticate, authorize('admin'), validate(validateCreateZone), zoneController.create);
router.put('/:id', authenticate, authorize('admin'), validate(validateUpdateZone), zoneController.update);
router.delete('/:id', authenticate, authorize('admin'), zoneController.remove);

module.exports = router;
