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
    super('Validation failed', 400, details);
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class RollbackError extends AppError {
  constructor(message = 'Error durante la limpieza de la operación anterior') {
    super(message, 500);
  }
}

class PhotoUploadError extends AppError {
  constructor(message = 'Error al subir la foto') {
    super(message, 500);
  }
}

class ConflictResolutionError extends AppError {
  constructor(message) {
    super(message, 409);
  }
}

module.exports = { AppError, ValidationError, ConflictError, NotFoundError, RollbackError, PhotoUploadError, ConflictResolutionError };
