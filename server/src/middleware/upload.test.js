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

  const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0x00]);
  const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const webpBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);

  it('accepts image/jpeg with valid magic bytes', () => {
    proxyquire('./upload', {
      multer: multerMock,
      '../errors/AppError': { AppError: AppErrorMock },
    });

    const cb = vi.fn();
    capturedFileFilter({}, { mimetype: 'image/jpeg', buffer: jpegBuffer }, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('accepts image/png with valid magic bytes', () => {
    proxyquire('./upload', {
      multer: multerMock,
      '../errors/AppError': { AppError: AppErrorMock },
    });

    const cb = vi.fn();
    capturedFileFilter({}, { mimetype: 'image/png', buffer: pngBuffer }, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('accepts image/webp with valid magic bytes', () => {
    proxyquire('./upload', {
      multer: multerMock,
      '../errors/AppError': { AppError: AppErrorMock },
    });

    const cb = vi.fn();
    capturedFileFilter({}, { mimetype: 'image/webp', buffer: webpBuffer }, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('rejects image with mismatched magic bytes', () => {
    proxyquire('./upload', {
      multer: multerMock,
      '../errors/AppError': { AppError: AppErrorMock },
    });

    const cb = vi.fn();
    capturedFileFilter({}, { mimetype: 'image/jpeg', buffer: Buffer.from([0x00, 0x00, 0x00]) }, cb);
    expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
    expect(cb.mock.calls[0][0].message).toContain('formato de imagen');
  });

  it('rejects image/gif mime type with AppError', () => {
    proxyquire('./upload', {
      multer: multerMock,
      '../errors/AppError': { AppError: AppErrorMock },
    });

    const cb = vi.fn();
    capturedFileFilter({}, { mimetype: 'image/gif', buffer: jpegBuffer }, cb);
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
    capturedFileFilter({}, { mimetype: 'image/bmp', buffer: jpegBuffer }, cb);
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
    const upload = proxyquire('./upload', {
      multer: multerMock,
      '../errors/AppError': { AppError: AppErrorMock },
    });

    expect(upload).toBeDefined();
    expect(upload.single).toBeDefined();
    expect(typeof upload.single).toBe('function');
  });
});
