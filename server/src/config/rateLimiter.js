/**
 * rateLimiter.js — Express rate limiting
 *
 * Two limiters:
 *
 *   authLimiter   — strict: 10 requests per 15 min on auth routes.
 *                   Prevents brute-force login/register attacks.
 *
 *   apiLimiter    — relaxed: 200 requests per 15 min for all API routes.
 *                   Prevents API abuse and denial-of-service.
 *
 * In development both limiters are still active but use generous windows
 * so they don't interfere with rapid local testing.
 */

const rateLimit = require('express-rate-limit');
const { isDev } = require('./env');

const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,          // 15 minutes
  max:              isDev ? 100 : 10,          // 100 in dev, 10 in prod
  standardHeaders:  true,
  legacyHeaders:    false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again in 15 minutes.',
  },
});

const apiLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              isDev ? 2000 : 200,
  standardHeaders:  true,
  legacyHeaders:    false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
});

module.exports = { authLimiter, apiLimiter };
