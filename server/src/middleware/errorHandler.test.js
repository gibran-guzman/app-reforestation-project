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

  it('uses error status property if it exists', () => {
    const err = new Error('Custom');
    err.status = 429;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('defaults to 500 if no status', () => {
    const err = new Error('Generic');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('maps postgres 22P02 to 400 Bad Request', () => {
    const err = new Error('Invalid input syntax');
    err.code = '22P02';

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Parámetro de consulta inválido' });
  });
});
