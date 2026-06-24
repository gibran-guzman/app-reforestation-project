const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

router.get('/soil-textures', configController.getSoilTextures);

module.exports = router;
