import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

const { ValidationError } = require('../errors/AppError');

const validate = proxyquire('./validate', {});

describe('validate middleware', () => {
  it('calls schemaFn with req.body and assigns result to req.body on success', () => {
    const schemaFn = vi.fn((body) => ({ ...body, validated: true }));
    const middleware = validate(schemaFn);
    const req = { body: { name: 'test' } };
    const res = {};
    const next = vi.fn();

    middleware(req, res, next);

    expect(schemaFn).toHaveBeenCalledWith({ name: 'test' });
    expect(req.body).toEqual({ name: 'test', validated: true });
    expect(next).toHaveBeenCalledWith();
  });

  it('passes ValidationError to next when schemaFn throws', () => {
    const validationError = new ValidationError([{ field: 'name', message: 'Name is required' }]);
    const schemaFn = vi.fn(() => { throw validationError; });
    const middleware = validate(schemaFn);
    const req = { body: {} };
    const res = {};
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(validationError);
  });

  it('passes unknown errors to next', () => {
    const schemaFn = vi.fn(() => { throw new Error('Unexpected'); });
    const middleware = validate(schemaFn);
    const req = { body: {} };
    const res = {};
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
