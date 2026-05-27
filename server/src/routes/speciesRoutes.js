const express = require('express');
const router = express.Router();
const speciesController = require('../controllers/speciesController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', speciesController.list);
router.get('/:id', speciesController.getById);
router.post('/', authenticate, authorize('admin'), speciesController.createSpecies);
router.put('/:id', authenticate, authorize('admin'), speciesController.update);
router.delete('/:id', authenticate, authorize('admin'), speciesController.remove);

module.exports = router;