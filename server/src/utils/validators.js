const validateRange = (value, field, min, max, label) => {
  if (value === undefined || value === null) return null;
  const num = Number(value);
  if (isNaN(num) || num < min || num > max) {
    return { field, message: `${label} debe estar entre ${min} y ${max}` };
  }
  return null;
};

module.exports = { validateRange };
