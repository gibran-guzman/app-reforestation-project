const { AppError } = require('../errors/AppError');

const buildWhereClause = (filters, tableAlias = '') => {
  const conditions = [];
  const params = [];
  let idx = 1;
  const prefix = tableAlias ? `${tableAlias}.` : '';

  if (filters.zone_id) {
    conditions.push(`${prefix}zone_id = $${idx++}`);
    params.push(filters.zone_id);
  }
  if (filters.species_id) {
    conditions.push(`${prefix}species_id = $${idx++}`);
    params.push(filters.species_id);
  }
  if (filters.from) {
    conditions.push(`${prefix}planted_at >= $${idx++}`);
    params.push(filters.from);
  }
  if (filters.to) {
    conditions.push(`${prefix}planted_at <= $${idx++}`);
    params.push(filters.to);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params, conditions };
};

const parseQueryFilters = (query) => {
  const filters = {};

  if (query.zone_id) {
    const val = parseInt(query.zone_id, 10);
    if (!Number.isInteger(val) || val < 1) {
      throw new AppError('El filtro zone_id debe ser un número entero positivo', 400);
    }
    filters.zone_id = val;
  }

  if (query.species_id) {
    const val = parseInt(query.species_id, 10);
    if (!Number.isInteger(val) || val < 1) {
      throw new AppError('El filtro species_id debe ser un número entero positivo', 400);
    }
    filters.species_id = val;
  }

  if (query.from) {
    const ts = Date.parse(query.from);
    if (isNaN(ts)) {
      throw new AppError('El filtro from debe ser una fecha válida (YYYY-MM-DD)', 400);
    }
    filters.from = query.from;
  }

  if (query.to) {
    const ts = Date.parse(query.to);
    if (isNaN(ts)) {
      throw new AppError('El filtro to debe ser una fecha válida (YYYY-MM-DD)', 400);
    }
    filters.to = query.to;
  }

  return filters;
};

module.exports = { buildWhereClause, parseQueryFilters };
