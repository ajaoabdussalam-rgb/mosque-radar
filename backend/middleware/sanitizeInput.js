/**
 * NoSQL Injection Protection Middleware
 * Recursively scans request body, query params, and route params for prohibited
 * MongoDB operator characters (keys starting with '$' or containing '.').
 */
function hasProhibitedKey(obj) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      return true;
    }

    const val = obj[key];
    if (typeof val === 'object' && val !== null) {
      if (hasProhibitedKey(val)) {
        return true;
      }
    }
  }

  return false;
}

const sanitizeInput = (req, res, next) => {
  if (
    hasProhibitedKey(req.body) ||
    hasProhibitedKey(req.query) ||
    hasProhibitedKey(req.params)
  ) {
    return res.status(400).json({
      success: false,
      message: 'Malformed request: prohibited operator characters ($ or .) detected in input keys'
    });
  }

  next();
};

module.exports = sanitizeInput;
