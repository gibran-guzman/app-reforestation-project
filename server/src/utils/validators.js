const validateRange = (value, field, min, max, label) => {
  if (value === undefined || value === null) return null;
  const num = Number(value);
  if (isNaN(num) || num < min || num > max) {
    return { field, message: `${label} debe estar entre ${min} y ${max}` };
  }
  return null;
};

const todayLocal = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date());

const validatePhotoUrl = (value, field = 'photo_url') => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 2000) {
    return { field, message: `${field} debe ser una URL válida` };
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    return { field, message: `${field} debe ser una URL válida` };
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { field, message: `${field} debe ser una URL http(s) válida` };
  }
  return null;
};

module.exports = { validateRange, todayLocal, validatePhotoUrl };
