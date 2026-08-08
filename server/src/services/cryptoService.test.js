import { vi } from 'vitest';
import { createRequire } from 'module';
const cjsRequire = createRequire(import.meta.url);
const proxyquire = cjsRequire('proxyquire').noPreserveCache();
const crypto = cjsRequire('crypto');

const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

function loadCryptoService() {
  return proxyquire('./cryptoService', {
    '../utils/logger': mockLogger,
  });
}

async function withEnv(env, fn) {
  const originals = {};
  Object.keys(env).forEach((key) => {
    originals[key] = process.env[key];
    if (env[key] === undefined) delete process.env[key];
    else process.env[key] = env[key];
  });
  try {
    return await fn();
  } finally {
    Object.keys(env).forEach((key) => {
      if (originals[key] === undefined) delete process.env[key];
      else process.env[key] = originals[key];
    });
  }
}

function generateKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
}

describe('cryptoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates an ephemeral key pair in memory when no env key is set', async () => {
    const publicKey = await withEnv({ LOGIN_ENCRYPTION_PRIVATE_KEY: undefined }, async () => {
      const service = loadCryptoService();
      return service.getPublicKey();
    });

    expect(publicKey).toContain('BEGIN PUBLIC KEY');
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('loads a persistent key pair from LOGIN_ENCRYPTION_PRIVATE_KEY', async () => {
    const { privateKey } = generateKeyPair();
    const b64 = Buffer.from(privateKey).toString('base64');

    const publicKey = await withEnv({ LOGIN_ENCRYPTION_PRIVATE_KEY: b64 }, async () => {
      const service = loadCryptoService();
      return service.getPublicKey();
    });

    expect(publicKey).toContain('BEGIN PUBLIC KEY');
    expect(mockLogger.info).toHaveBeenCalledWith('Login encryption key loaded from LOGIN_ENCRYPTION_PRIVATE_KEY');
  });

  it('rejects weak keys and falls back to an ephemeral key', async () => {
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 1024,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const b64 = Buffer.from(privateKey).toString('base64');

    const publicKey = await withEnv({ LOGIN_ENCRYPTION_PRIVATE_KEY: b64 }, async () => {
      const service = loadCryptoService();
      return service.getPublicKey();
    });

    expect(publicKey).toContain('BEGIN PUBLIC KEY');
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.stringContaining('too weak') }),
      'Invalid LOGIN_ENCRYPTION_PRIVATE_KEY — falling back to an ephemeral in-memory key',
    );
  });

  it('decrypts a password encrypted with the public key (OAEP sha256)', async () => {
    const { privateKey, publicKey } = generateKeyPair();
    const b64 = Buffer.from(privateKey).toString('base64');

    const encrypted = crypto.publicEncrypt(
      { key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
      Buffer.from('mi-clave-secreta'),
    );

    const decrypted = await withEnv({ LOGIN_ENCRYPTION_PRIVATE_KEY: b64 }, async () => {
      const service = loadCryptoService();
      return service.decryptPassword(encrypted.toString('base64'));
    });
    expect(decrypted).toBe('mi-clave-secreta');
  });

  it('produces consistent keys across reloads when a persistent env key is set', async () => {
    const { privateKey } = generateKeyPair();
    const b64 = Buffer.from(privateKey).toString('base64');

    const k1 = await withEnv({ LOGIN_ENCRYPTION_PRIVATE_KEY: b64 }, async () => {
      const service = loadCryptoService();
      return service.getPublicKey();
    });
    const k2 = await withEnv({ LOGIN_ENCRYPTION_PRIVATE_KEY: b64 }, async () => {
      const service = loadCryptoService();
      return service.getPublicKey();
    });

    expect(k1).toBe(k2);
  });
});
