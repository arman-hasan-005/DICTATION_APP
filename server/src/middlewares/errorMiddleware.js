/**
 * errorMiddleware.js — Production-grade global error handler
 *
 * CHANGES from original:
 *   - Uses Winston logger instead of console.error
 *   - Logs full stack trace for non-operational errors in production
 *   - Consistent { success, message, ...(isDev && { stack }) } response shape
 *   - Handles JWT errors explicitly (TokenExpiredError, JsonWebTokenError)
 *   - Handles Mongoose CastError (invalid ObjectId → 400, not 500)
 *   - Handles Mongoose ValidationError (schema validation → 400)
 *   - Handles Mongoose duplicate key error (11000 → 409 Conflict)
 */

const logger     = require('../config/logger');
const { isDev }  = require('../config/env');

const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || 500;
  let message    = err.isOperational ? err.message : 'Something went wrong. Please try again.';

  // ── Multer errors ──────────────────────────────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message    = 'File is too large. Maximum size is 15 MB.';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message    = 'Unexpected file field.';
  } else if (err.message?.includes('Unsupported file type')) {
    statusCode = 400;
    message    = err.message;
  }

  // ── JWT errors ─────────────────────────────────────────────────────────────
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message    = 'Session expired. Please log in again.';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message    = 'Invalid token. Please log in again.';
  }

  // ── Mongoose errors ────────────────────────────────────────────────────────
  else if (err.name === 'CastError') {
    statusCode = 400;
    message    = `Invalid ${err.path}: ${err.value}`;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message    = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message    = `A record with that ${field} already exists.`;
  }

  // ── Logging ────────────────────────────────────────────────────────────────
  if (statusCode >= 500) {
    logger.error('Unhandled server error', {
      statusCode,
      message:  err.message,
      stack:    err.stack,
      path:     req.path,
      method:   req.method,
    });
  } else if (isDev) {
    logger.debug(`[${statusCode}] ${message}`, { path: req.path });
  }

  // ── Response ───────────────────────────────────────────────────────────────
  res.status(statusCode).json({
    success: false,
    message,
    ...(isDev && statusCode >= 500 && { stack: err.stack }),
  });
};

module.exports = errorHandler;
