const { SOIL_TEXTURES } = require('../config/constants');
const { respond } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const getSoilTextures = asyncHandler(async (req, res) => {
  respond(res, SOIL_TEXTURES);
});

module.exports = { getSoilTextures };
