const speciesService = require('../services/speciesService');

const createSpecies = async (req, res) => {
  const result = await speciesService.createSpecies(req.body);
  res.status(201).json(result);
};

module.exports = { createSpecies };
