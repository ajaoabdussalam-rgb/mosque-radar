/**
 * Global error-handling middleware for Express.
 *
 * Express recognises this as an error handler because it has
 * four parameters: (err, req, res, next).
 *
 * Every error response follows a consistent JSON shape:
 *   { success: false, message: "..." }
 */
const errorHandler = (err, req, res, next) => {
  // Log the full error for debugging (server console only, never sent to client)
  console.error(err.stack);

  // If headers were already sent, delegate to the default Express handler
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  // Mongoose validation error (e.g. required field missing, out of bounds)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Mongoose cast error (e.g. malformed ObjectId in URL parameter)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for parameter '${err.path}'`;
  }

  // Multer upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File is too large. Maximum allowed size is 5MB.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded or unexpected upload field.';
    } else {
      message = err.message || 'File upload error.';
    }
  }

  res.status(statusCode).json({
    success: false,
    message: message,
  });
};

module.exports = errorHandler;
