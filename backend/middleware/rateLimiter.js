const rateLimit = require('express-rate-limit');

const isTestEnv = process.env.NODE_ENV === 'test';

/**
 * General API rate limiter
 * Allows up to 300 requests per 15-minute window in production, higher in test mode.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address, please try again after 15 minutes'
  }
});

/**
 * Sensitive authentication route rate limiter
 * Protects login and register endpoints against automated brute-force attempts.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 1000 : 30, // 30 attempts per 15-minute window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
