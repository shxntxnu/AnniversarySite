const crypto = require('crypto');
const config = require('../config/config');

const ALGORITHM = 'aes-256-gcm';

// Derive 32-byte key from config or fallback
function getKey() {
  const hex = config.crypto.keyHex;
  if (hex && hex.length === 64) {
    return Buffer.from(hex, 'hex');
  }
  return crypto.createHash('sha256').update(hex || 'default_secret_key_32_bytes_long').digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns formatted string: ivHex:authTagHex:encryptedHex
 */
function encrypt(text) {
  if (!text) return '';
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a string created with encrypt().
 */
function decrypt(ciphertext) {
  if (!ciphertext) return '';
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format');
  }
  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = {
  encrypt,
  decrypt
};
