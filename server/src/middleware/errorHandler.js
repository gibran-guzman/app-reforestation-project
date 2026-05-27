const logger = require('../utils/logger');
const { AppError } = require('../errors/AppError');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    logger.warn({ err, status: err.status }, err.message);
    const response = { error: err.message };
    if (err.details) {
      response.details = err.details;
    }
    return res.status(err.status).json(response);
  }

  logger.error({ err }, 'Unhandled internal error');

  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message,
  });
};

module.exports = errorHandler;
