const crypto = require('crypto');
const logger = require('../utils/logger');

let keyPair = null;

function ensureKeyPair() {
  if (!keyPair) {
    keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    logger.info('RSA key pair generated for login encryption');
  }
  return keyPair;
}

function getPublicKey() {
  const pair = ensureKeyPair();
  return pair.publicKey;
}

function decryptPassword(encryptedBase64) {
  const pair = ensureKeyPair();
  const buffer = Buffer.from(encryptedBase64, 'base64');
  const decrypted = crypto.privateDecrypt(
    {
      key: pair.privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    buffer,
  );
  return decrypted.toString('utf-8');
}

module.exports = { getPublicKey, decryptPassword };
