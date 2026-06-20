const { AppError } = require('../errors/AppError');

const parseId = (param) => {
  const id = Number(param);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError('ID inválido', 400);
  }
  return id;
};

module.exports = parseId;
