const { ValidationError } = require('../errors/AppError');

const validateReportFilters = (filters) => {
  const errors = [];

  if (filters.zone_id !== undefined && (!Number.isInteger(filters.zone_id) || filters.zone_id < 1)) {
    errors.push({ field: 'zone_id', message: 'El ID de zona debe ser un entero positivo' });
  }

  if (filters.species_id !== undefined && (!Number.isInteger(filters.species_id) || filters.species_id < 1)) {
    errors.push({ field: 'species_id', message: 'El ID de especie debe ser un entero positivo' });
  }

  if (filters.from !== undefined) {
    const d = new Date(filters.from);
    if (isNaN(d.getTime())) {
      errors.push({ field: 'from', message: 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)' });
    }
  }

  if (filters.to !== undefined) {
    const d = new Date(filters.to);
    if (isNaN(d.getTime())) {
      errors.push({ field: 'to', message: 'La fecha de fin debe ser una fecha válida (YYYY-MM-DD)' });
    }
  }

  if (filters.from && filters.to && new Date(filters.from) > new Date(filters.to)) {
    errors.push({ field: 'from', message: 'La fecha de inicio debe ser anterior a la fecha de fin' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};

module.exports = { validateReportFilters };
