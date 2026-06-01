const express = require('express');
const router = express.Router();
const plantingController = require('../controllers/plantingController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, plantingController.getAll);
router.get('/:id', authenticate, plantingController.getById);
router.post('/', authenticate, authorize('admin', 'technician'), plantingController.create);

module.exports = router;
