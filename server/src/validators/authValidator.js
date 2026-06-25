const { ValidationError } = require('../errors/AppError');
const { ALLOWED_ROLES, ROLE_LABELS, MAX_FULL_NAME_LENGTH, MAX_PASSWORD_LENGTH } = require('../config/constants');

const ROLE_NAMES = ROLE_LABELS.map(l => l.label).join(', ');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateSignup = (data) => {
  const errors = [];
  const { email, password, full_name, role } = data || {};

  if (!email || typeof email !== 'string') {
    errors.push({ field: 'email', message: 'El correo electrónico es requerido' });
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push({ field: 'email', message: 'El correo electrónico no tiene un formato válido' });
  }

  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'La contraseña es requerida' });
  } else if (password.length < 8) {
    errors.push({ field: 'password', message: 'La contraseña debe tener al menos 8 caracteres' });
  } else if (password.length > MAX_PASSWORD_LENGTH) {
    errors.push({ field: 'password', message: `La contraseña no debe exceder ${MAX_PASSWORD_LENGTH} caracteres` });
  }

  if (!full_name || typeof full_name !== 'string') {
    errors.push({ field: 'full_name', message: 'El nombre completo es requerido' });
  } else if (full_name.trim().length > MAX_FULL_NAME_LENGTH) {
    errors.push({ field: 'full_name', message: `El nombre completo no debe exceder ${MAX_FULL_NAME_LENGTH} caracteres` });
  }

  if (role !== undefined && role !== null) {
    if (!ALLOWED_ROLES.includes(role)) {
      errors.push({ field: 'role', message: `El rol debe ser uno de: ${ROLE_NAMES}` });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return {
    email: email.trim(),
    password,
    full_name: full_name.trim(),
    role: role || 'technician',
  };
};

const validateLogin = (data) => {
  const errors = [];
  const { email, password } = data || {};

  if (!email || typeof email !== 'string') {
    errors.push({ field: 'email', message: 'El correo electrónico es requerido' });
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push({ field: 'email', message: 'El correo electrónico no tiene un formato válido' });
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
