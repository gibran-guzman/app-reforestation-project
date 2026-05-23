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

module.exports = { AppError, ValidationError, ConflictError, NotFoundError };
