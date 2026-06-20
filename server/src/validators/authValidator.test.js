import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);

const { validateSignup, validateLogin } = cjsRequire('./authValidator');
const { ValidationError } = cjsRequire('../errors/AppError');

describe('validateSignup', () => {
  const validData = {
    email: 'test@example.com',
    password: 'SecurePass1',
    full_name: 'Tester User',
    role: 'technician',
  };

  it('passes with valid data and explicit role', () => {
    const result = validateSignup(validData);
    expect(result.email).toBe('test@example.com');
    expect(result.role).toBe('technician');
  });

  it('defaults to technician role if not specified', () => {
    const result = validateSignup({ ...validData, role: undefined });
    expect(result.role).toBe('technician');
  });

  it('defaults to technician role if invalid role', () => {
    const result = validateSignup({ ...validData, role: 'superadmin' });
    expect(result.role).toBe('technician');
  });

  it('accepts admin role', () => {
    const result = validateSignup({ ...validData, role: 'admin' });
    expect(result.role).toBe('admin');
  });

  it('throws error if email is empty', () => {
    expect(() => validateSignup({ ...validData, email: '' })).toThrow(ValidationError);
  });

  it('throws error if email is not a string', () => {
    expect(() => validateSignup({ ...validData, email: 123 })).toThrow(ValidationError);
  });

  it('throws error if password is empty', () => {
    expect(() => validateSignup({ ...validData, password: '' })).toThrow(ValidationError);
  });

  it('throws error if password is less than 8 characters', () => {
    expect(() => validateSignup({ ...validData, password: 'Abc123' })).toThrow(ValidationError);
  });

  it('throws error if full_name is empty', () => {
    expect(() => validateSignup({ ...validData, full_name: '' })).toThrow(ValidationError);
  });

  it('throws with details of missing fields', () => {
    try {
      validateSignup({});
    } catch (err) {
      expect(err.details.length).toBe(3);
      const fields = err.details.map((d) => d.field);
      expect(fields).toContain('email');
      expect(fields).toContain('password');
      expect(fields).toContain('full_name');
    }
  });

  it('throws error if data is undefined', () => {
    expect(() => validateSignup(undefined)).toThrow(ValidationError);
  });
});

describe('validateLogin', () => {
  const validData = { email: 'test@example.com', password: 'SecurePass1' };

  it('passes with valid data', () => {
    const result = validateLogin(validData);
    expect(result.email).toBe('test@example.com');
    expect(result.password).toBe('SecurePass1');
  });

  it('throws error if email is empty', () => {
    expect(() => validateLogin({ ...validData, email: '' })).toThrow(ValidationError);
  });

  it('throws error if email is not a string', () => {
    expect(() => validateLogin({ ...validData, email: null })).toThrow(ValidationError);
  });

  it('throws error if password is empty', () => {
    expect(() => validateLogin({ ...validData, password: '' })).toThrow(ValidationError);
  });

  it('throws with details of missing fields', () => {
    expect(() => validateLogin({})).toThrow(ValidationError);
  });

  it('handles undefined data (edge case)', () => {
    expect(() => validateLogin(undefined)).toThrow(ValidationError);
  });

  it('throws error if password is not a string', () => {
    expect(() => validateLogin({ email: 'test@example.com', password: 123 })).toThrow(ValidationError);
  });
});
