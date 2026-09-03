import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const { ValidationError, NotFoundError, AppError } = cjsRequire('../errors/AppError');
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const errorHandler = proxyquire('./errorHandler', {});

describe('errorHandler middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  it('handles validation error with details', () => {
    const err = new ValidationError([{ field: 'email', message: 'Required' }]);

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error de validación',
      details: [{ field: 'email', message: 'Required' }],
    });
  });

  it('handles not found error', () => {
    const err = new NotFoundError('Planting not found');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Planting not found',
    });
  });

  it('handles app error with custom status', () => {
    const err = new AppError('Custom error', 409);

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Custom error' });
  });

  it('hides non-app error message in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const err = new Error('Internal crash detail');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error interno del servidor',
    });
    process.env.NODE_ENV = originalEnv;
  });

  it('shows non-app error message in development', () => {
    const err = new Error('SQL syntax error');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'SQL syntax error',
    });
  });

  it('always responds 500 for non-app errors regardless of err.status', () => {
    const err = new Error('Custom');
    err.status = 429;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('defaults to 500 if no status', () => {
    const err = new Error('Generic');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('maps malformed JSON body to 400 Bad Request', () => {
    const err = new Error('Unexpected token } in JSON');
    err.type = 'entity.parse.failed';

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'El cuerpo de la solicitud no es JSON válido' });
  });

  it('maps postgres 22P02 to 400 Bad Request', () => {
    const err = new Error('Invalid input syntax');
    err.code = '22P02';

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Parámetro de consulta inválido' });
  });

  it('maps multer LIMIT_FILE_SIZE to 413 Payload Too Large', () => {
    const err = new Error('File too large');
    err.code = 'LIMIT_FILE_SIZE';

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({ error: 'El archivo supera el tamaño máximo permitido' });
  });

  it('maps multer LIMIT_UNEXPECTED_FILE to 400 Bad Request', () => {
    const err = new Error('Unexpected field');
    err.code = 'LIMIT_UNEXPECTED_FILE';

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Archivo inesperado en la solicitud' });
  });
});
