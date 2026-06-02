const { SOIL_TEXTURES } = require('../config/constants');

const getSoilTextures = async (req, res, next) => {
  try {
    res.json({ data: SOIL_TEXTURES });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSoilTextures };
