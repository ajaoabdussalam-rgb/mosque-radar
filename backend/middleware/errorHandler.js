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

  res.status(statusCode).json({
    success: false,
    message: message,
  });
};

module.exports = errorHandler;
