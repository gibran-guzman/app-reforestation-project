const express = require('express');
const router = express.Router();
const speciesController = require('../controllers/speciesController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { validateCreateSpecies, validateUpdateSpecies } = require('../validators/speciesValidator');

router.get('/', authenticate, speciesController.list);
router.get('/:id', authenticate, speciesController.getById);
router.post('/', authenticate, authorize('admin'), validate(validateCreateSpecies), speciesController.createSpecies);
router.put('/:id', authenticate, authorize('admin'), validate(validateUpdateSpecies), speciesController.update);
router.delete('/:id', authenticate, authorize('admin'), speciesController.remove);

module.exports = router;
