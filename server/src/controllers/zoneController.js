const zoneService = require('../services/zoneService');

const list = async (req, res) => {
  const zones = await zoneService.list();
  res.json({ data: zones });
};

const getById = async (req, res) => {
  const zone = await zoneService.getById(Number(req.params.id));
  res.json({ data: zone });
};

const create = async (req, res) => {
  const zone = await zoneService.create(req.body);
  res.status(201).json({ message: 'Intervention zone created successfully', data: zone });
};

const update = async (req, res) => {
  const zone = await zoneService.update(Number(req.params.id), req.body);
  res.json({ message: 'Intervention zone updated successfully', data: zone });
};

const remove = async (req, res) => {
  await zoneService.remove(Number(req.params.id));
  res.json({ message: 'Intervention zone deleted successfully' });
};

module.exports = { list, getById, create, update, remove };
