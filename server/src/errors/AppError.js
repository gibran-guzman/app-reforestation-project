class AppError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(details) {
    super('Error de validación', 400, details);
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

class PhotoUploadError extends AppError {
  constructor(message = 'Error al subir la foto') {
    super(message, 500);
  }
}

module.exports = { AppError, ValidationError, ConflictError, NotFoundError, PhotoUploadError };
