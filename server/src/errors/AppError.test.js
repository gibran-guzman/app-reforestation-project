import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);

const { AppError, ValidationError, ConflictError, NotFoundError } = cjsRequire('./AppError');

describe('AppError', () => {
  it('creates an error with message and default status 500', () => {
    const err = new AppError('Something went wrong');
    expect(err.message).toBe('Something went wrong');
    expect(err.status).toBe(500);
    expect(err.details).toBeNull();
    expect(err.name).toBe('AppError');
  });

  it('creates an error with custom status and details', () => {
    const err = new AppError('Not found', 404, { resource: 'user' });
    expect(err.message).toBe('Not found');
    expect(err.status).toBe(404);
    expect(err.details).toEqual({ resource: 'user' });
  });
});

describe('ValidationError', () => {
  it('creates with 400 status and passed details', () => {
    const details = [{ field: 'email', message: 'Required' }];
    const err = new ValidationError(details);
    expect(err.message).toBe('Validation failed');
    expect(err.status).toBe(400);
    expect(err.details).toEqual(details);
    expect(err.name).toBe('ValidationError');
  });
});

describe('ConflictError', () => {
  it('creates with 409 status', () => {
    const err = new ConflictError('Already exists');
    expect(err.message).toBe('Already exists');
    expect(err.status).toBe(409);
    expect(err.name).toBe('ConflictError');
  });
});

describe('NotFoundError', () => {
  it('creates with 404 status and default message', () => {
    const err = new NotFoundError();
    expect(err.message).toBe('Resource not found');
    expect(err.status).toBe(404);
    expect(err.name).toBe('NotFoundError');
  });

  it('creates with custom message', () => {
    const err = new NotFoundError('Planting not found');
    expect(err.message).toBe('Planting not found');
    expect(err.status).toBe(404);
  });
});
