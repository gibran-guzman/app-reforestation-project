const logger = require('../utils/logger');
const { AppError } = require('../errors/AppError');
const pgCodes = require('../errors/pgCodes');

const sanitizeLogPayload = (err, status) => {
  const payload = { err: err.message, status };
  if (err.details) {
    payload.details = err.details;
  }
  return payload;
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    logger.warn(sanitizeLogPayload(err, err.status), err.message);
    const response = { error: err.message };
    if (err.details) {
      response.details = err.details;
    }
    return res.status(err.status).json(response);
  }

  if (err.code === pgCodes.INVALID_INPUT_SYNTAX) {
    logger.warn({ err: err.message }, 'Invalid input syntax in query');
    return res.status(400).json({ error: 'Parámetro de consulta inválido' });
  }

  const context = {
    err: err.message,
    method: req.method,
    path: req.path,
    userId: req.user?.id,
  };
  logger.error(context, 'Unhandled internal error');

  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message,
  });
};

module.exports = errorHandler;
