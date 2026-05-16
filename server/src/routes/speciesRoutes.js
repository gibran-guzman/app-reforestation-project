const express = require('express');
const router = express.Router();
const speciesController = require('../controllers/speciesController');

// POST /api/species - Registers a new species
router.post('/', speciesController.createSpecies);

module.exports = router;