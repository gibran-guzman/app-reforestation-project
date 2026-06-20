const { ValidationError } = require('../errors/AppError');
const { ALLOWED_ROLES } = require('../config/constants');

const validateSignup = (data) => {
  const errors = [];
  const { email, password, full_name, role } = data || {};

  if (!email || typeof email !== 'string') {
    errors.push({ field: 'email', message: 'El correo electrónico es requerido' });
  }

  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'La contraseña es requerida' });
  } else if (password.length < 8) {
    errors.push({ field: 'password', message: 'La contraseña debe tener al menos 8 caracteres' });
  }

  if (!full_name || typeof full_name !== 'string') {
    errors.push({ field: 'full_name', message: 'El nombre completo es requerido' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return {
    email: email.trim(),
    password,
    full_name: full_name.trim(),
    role: ALLOWED_ROLES.includes(role) ? role : 'technician',
  };
};

const validateLogin = (data) => {
  const errors = [];
  const { email, password } = data || {};

  if (!email || typeof email !== 'string') {
    errors.push({ field: 'email', message: 'El correo electrónico es requerido' });
  }

  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'La contraseña es requerida' });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return { email: email.trim(), password };
};

module.exports = { validateSignup, validateLogin };
