const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mai-hoonaa-admin-secret-key-2026';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'mai-hoonaa-refresh-secret-key-2026';

const signAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

const signRefreshToken = (payload) => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  JWT_SECRET,
  REFRESH_SECRET
};
