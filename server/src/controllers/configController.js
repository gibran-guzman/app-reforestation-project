const { SOIL_TEXTURES } = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');

const getSoilTextures = asyncHandler(async (req, res) => {
  res.json({ data: SOIL_TEXTURES });
});

module.exports = { getSoilTextures };
