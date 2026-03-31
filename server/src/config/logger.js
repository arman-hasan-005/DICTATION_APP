/**
 * logger.js — Winston structured logger
 *
 * Replaces scattered console.log/console.error calls.
 *
 * In development: coloured, human-readable output to console.
 * In production : JSON lines to stdout (compatible with Datadog, CloudWatch,
 *                 Logtail, and any log aggregator that reads stdout).
 *
 * Usage:
 *   const logger = require('./config/logger');
 *   logger.info('Server started', { port: 5000 });
 *   logger.error('DB connection failed', { error: err.message });
 */

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, errors, json, colorize, simple } = format;
const { isDev } = require('./env');

const logger = createLogger({
  level: isDev ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    isDev ? combine(colorize(), simple()) : json(),
  ),
  transports: [
    new transports.Console(),
  ],
  // Prevent Winston from exiting on uncaught errors
  exitOnError: false,
});

module.exports = logger;
