const jwt = require('jsonwebtoken');

const signToken = (
  payload,
  secret = process.env.JWT_SECRET || 'mai-hoonaa-admin-secret-key-2026',
  expiresIn = '24h'
) => {
  return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = (
  token,
  secret = process.env.JWT_SECRET || 'mai-hoonaa-admin-secret-key-2026'
) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

module.exports = {
  signToken,
  verifyToken,
};
