const jwt = require('jsonwebtoken');

// CWE-547: Never use hardcoded fallback secrets in production.
// JWT_SECRET and REFRESH_SECRET MUST be set as environment variables.
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

if (!JWT_SECRET || !REFRESH_SECRET) {
  throw new Error(
    'FATAL: JWT_SECRET and REFRESH_SECRET environment variables are required. ' +
    'Set them in your .env file. Generate strong secrets with: ' +
    'node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
  );
}

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
