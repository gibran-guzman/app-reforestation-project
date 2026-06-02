const { ValidationError } = require('../errors/AppError');

const validateReportFilters = (filters) => {
  const errors = [];

  if (filters.zone_id !== undefined && (!Number.isInteger(filters.zone_id) || filters.zone_id < 1)) {
    errors.push({ field: 'zone_id', message: 'zone_id must be a positive integer' });
  }

  if (filters.species_id !== undefined && (!Number.isInteger(filters.species_id) || filters.species_id < 1)) {
    errors.push({ field: 'species_id', message: 'species_id must be a positive integer' });
  }

  if (filters.from !== undefined) {
    const d = new Date(filters.from);
    if (isNaN(d.getTime())) {
      errors.push({ field: 'from', message: 'from must be a valid date (YYYY-MM-DD)' });
    }
  }

  if (filters.to !== undefined) {
    const d = new Date(filters.to);
    if (isNaN(d.getTime())) {
      errors.push({ field: 'to', message: 'to must be a valid date (YYYY-MM-DD)' });
    }
  }

  if (filters.from && filters.to && new Date(filters.from) > new Date(filters.to)) {
    errors.push({ field: 'from', message: 'from date must be before to date' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};

module.exports = { validateReportFilters };
