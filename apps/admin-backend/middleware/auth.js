const { verifyAccessToken } = require('../utils/jwt');

/**
 * Middleware to verify JWT Access Token
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No valid token provided.' 
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Token expired or invalid. Please refresh your session.',
      code: 'TOKEN_EXPIRED'
    });
  }

  req.user = decoded;
  next();
};

/**
 * Middleware to restrict access based on user roles
 * @param {...string} allowedRoles - Roles permitted to access the route
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to perform this action.'
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  authorizeRoles
};
