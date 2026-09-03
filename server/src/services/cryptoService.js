const crypto = require('crypto');
const logger = require('../utils/logger');
const { AppError } = require('../errors/AppError');

const MIN_RSA_BITS = 2048;

let keyPairPromise = null;

function assertKeyStrength(keyObject) {
  const { modulusLength } = keyObject.asymmetricKeyDetails || {};
  if (modulusLength && modulusLength < MIN_RSA_BITS) {
    throw new Error(
      `LOGIN_ENCRYPTION_PRIVATE_KEY too weak: ${modulusLength} bits (minimum ${MIN_RSA_BITS})`,
    );
  }
}

function loadKeyPairFromEnv() {
  const privatePem = process.env.LOGIN_ENCRYPTION_PRIVATE_KEY;
  if (!privatePem) return null;

  let privateKey;
  try {
    const pem = Buffer.from(privatePem, 'base64').toString('utf-8');
    privateKey = crypto.createPrivateKey(pem);
    assertKeyStrength(privateKey);
  } catch (err) {
    logger.warn(
      { err: err.message },
      'Invalid LOGIN_ENCRYPTION_PRIVATE_KEY — falling back to an ephemeral in-memory key',
    );
    return null;
  }

  const publicKey = crypto.createPublicKey(privateKey).export({ type: 'spki', format: 'pem' });
  logger.info('Login encryption key loaded from LOGIN_ENCRYPTION_PRIVATE_KEY');
  return { privateKey, publicKey };
}

function generateKeyPair() {
  logger.warn(
    'LOGIN_ENCRYPTION_PRIVATE_KEY not set — generating an ephemeral RSA key in memory. ' +
      'The key is lost on restart, which invalidates any login attempt that used the previous public key. ' +
      'Set LOGIN_ENCRYPTION_PRIVATE_KEY (base64 PKCS#8 PEM) for a persistent key.',
  );
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair(
      'rsa',
      {
        modulusLength: MIN_RSA_BITS,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      },
      (err, publicKey, privateKey) => {
        if (err) reject(err);
        else resolve({ publicKey, privateKey });
      },
    );
  });
}

function ensureKeyPair() {
  if (!keyPairPromise) {
    keyPairPromise = Promise.resolve(loadKeyPairFromEnv() || generateKeyPair()).catch((err) => {
      keyPairPromise = null;
      throw err;
    });
  }
  return keyPairPromise;
}

async function getPublicKey() {
  const pair = await ensureKeyPair();
  return pair.publicKey;
}

async function decryptPassword(encryptedBase64) {
  if (!encryptedBase64 || typeof encryptedBase64 !== 'string') {
    throw new AppError('encrypted_password es requerido', 400);
  }

  const pair = await ensureKeyPair();
  let buffer;
  try {
    buffer = Buffer.from(encryptedBase64, 'base64');
  } catch {
    throw new AppError('encrypted_password no es válido', 400);
  }

  let decrypted;
  try {
    decrypted = crypto.privateDecrypt(
      {
        key: pair.privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer,
    );
  } catch {
    throw new AppError('No se pudo descifrar la contraseña. Solicita una nueva clave pública e inténtalo de nuevo.', 400);
  }

  const password = decrypted.toString('utf-8');
  if (!password) {
    throw new AppError('La contraseña descifrada está vacía', 400);
  }

  return password;
}

module.exports = { getPublicKey, decryptPassword };
