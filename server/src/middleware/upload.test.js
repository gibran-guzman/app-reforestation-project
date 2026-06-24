import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();

let capturedFileFilter;
let capturedLimits;
let capturedStorage;

const multerMock = vi.fn((opts) => {
  capturedFileFilter = opts.fileFilter;
  capturedLimits = opts.limits;
  capturedStorage = opts.storage;
  return {
    single: vi.fn(),
    array: vi.fn(),
    fields: vi.fn(),
    none: vi.fn(),
  };
});

const AppErrorMock = vi.fn((message, status) => {
  const err = new Error(message);
  err.status = status;
  return err;
});

describe('upload middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedFileFilter = undefined;
    capturedLimits = undefined;
    capturedStorage = undefined;
  });

  it('creates multer with memory storage', () => {
    proxyquire('./upload', {
      multer: multerMock,
      '../errors/AppError': { AppError: AppErrorMock },
    });

    expect(capturedStorage).toBeDefined();
  });

  it('configures 5MB file size limit', () => {
    proxyquire('./upload', {
      multer: multerMock,
      '../errors/AppError': { AppError: AppErrorMock },
    });

    expect(capturedLimits).toEqual({ fileSize: 5 * 1024 * 1024 });
  });

  it('rejects image/gif mime type with AppError', () => {
    proxyquire('./upload', {
      multer: multerMock,
      '../errors/AppError': { AppError: AppErrorMock },
    });

    const cb = vi.fn();
    capturedFileFilter({}, { mimetype: 'image/gif' }, cb);
    expect(cb).toHaveBeenCalledTimes(1);
    const err = cb.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Solo se permiten imágenes JPG, PNG o WebP');
    expect(err.status).toBe(400);
    expect(cb.mock.calls[0][1]).toBe(false);
  });

  it('rejects image/bmp mime type with AppError', () => {
    proxyquire('./upload', {
      multer: multerMock,
      '../errors/AppError': { AppError: AppErrorMock },
    });

    const cb = vi.fn();
    capturedFileFilter({}, { mimetype: 'image/bmp' }, cb);
    const err = cb.mock.calls[0][0];
    expect(err.message).toContain('JPG, PNG o WebP');
    expect(err.status).toBe(400);
  });

  it('rejects application/pdf mime type', () => {
    proxyquire('./upload', {
      multer: multerMock,
      '../errors/AppError': { AppError: AppErrorMock },
    });

    const cb = vi.fn();
    capturedFileFilter({}, { mimetype: 'application/pdf' }, cb);
    const err = cb.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(cb.mock.calls[0][1]).toBe(false);
  });

  it('exports a multer instance', () => {
    const mod = proxyquire('./upload', {
      multer: multerMock,
      '../errors/AppError': { AppError: AppErrorMock },
    });

    expect(mod.upload).toBeDefined();
    expect(mod.upload.single).toBeDefined();
    expect(typeof mod.upload.single).toBe('function');
    expect(mod.ALLOWED_MIME_TYPES).toBeDefined();
    expect(Array.isArray(mod.ALLOWED_MIME_TYPES)).toBe(true);
  });
});
