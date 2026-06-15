const crypto = require('crypto');

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const actualHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

function createToken(prefix) {
  return `${prefix}_${crypto.randomBytes(32).toString('hex')}`;
}

function createId(prefix) {
  return `${prefix}_${crypto.randomBytes(10).toString('hex')}`;
}

module.exports = { createPasswordHash, verifyPassword, createToken, createId };
