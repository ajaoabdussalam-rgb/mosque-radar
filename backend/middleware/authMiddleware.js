const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'mosque_radar_jwt_dev_secret_key_2026';

/**
 * Protect middleware — requires a valid Bearer token in the Authorization header.
 * Attaches the authenticated user document to req.user (excluding password).
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route — authentication token is missing'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The account associated with this token no longer exists'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: err.name === 'TokenExpiredError'
        ? 'Session has expired — please sign in again'
        : 'Invalid authentication token'
    });
  }
};

/**
 * Role-based authorization middleware.
 * Restricts access to users with one of the specified roles.
 *
 * @param  {...string} roles — e.g. 'moderator', 'admin'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this resource`
      });
    }
    next();
  };
};

/**
 * Optional authentication middleware.
 * If a valid Bearer token is provided, attaches req.user.
 * If no token is provided or the token is invalid, proceeds cleanly without setting req.user.
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
      }
    } catch {
      // Ignore token errors for optional auth — treat as anonymous visitor
    }
  }

  next();
};

module.exports = {
  protect,
  authorize,
  optionalAuth
};
