const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/app');

function signAccessToken(payload, options = {}) {
  // Add unique jti (JWT ID) to prevent token collisions
  const jti = crypto.randomBytes(16).toString('hex');
  return jwt.sign({ ...payload, jti }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    ...options,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

function signRefreshToken(payload, options = {}) {
  // Add unique jti (JWT ID) to prevent token collisions
  const jti = crypto.randomBytes(16).toString('hex');
  return jwt.sign({ ...payload, jti }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn,
    ...options,
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwtRefreshSecret);
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
};
