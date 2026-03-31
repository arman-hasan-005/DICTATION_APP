/**
 * env.js — Environment variable validation and export
 *
 * CHANGES from original:
 *   - Added `clientUrl` export (used by CORS in server.js)
 *   - Added `ttsServiceUrl` export (for Coqui TTS config reference)
 *   - JWT_SECRET minimum length enforced (weak secrets rejected at startup)
 *   - NODE_ENV validation
 */

require('dotenv').config();

const REQUIRED = ['MONGODB_URI', 'JWT_SECRET'];
REQUIRED.forEach((key) => {
  if (!process.env[key]) {
    console.error(`\n❌  Missing env variable: ${key}\n    Check server/.env\n`);
    process.exit(1);
  }
});

// Reject obviously weak JWT secrets in production
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
  console.error('\n❌  JWT_SECRET must be at least 32 characters in production\n');
  process.exit(1);
}

if (!process.env.GOOGLE_TTS_KEY) {
  console.warn('⚠️  GOOGLE_TTS_KEY not set — uploaded-content dictation will use browser voice fallback');
}

module.exports = {
  mongoURI:      process.env.MONGODB_URI,
  jwtSecret:     process.env.JWT_SECRET,
  googleTTSKey:  process.env.GOOGLE_TTS_KEY    || null,
  ttsServiceUrl: process.env.TTS_SERVICE_URL   || 'http://localhost:5001',
  clientUrl:     process.env.CLIENT_URL         || 'http://localhost:5173',
  port:          parseInt(process.env.PORT, 10) || 5000,
  nodeEnv:       process.env.NODE_ENV           || 'development',
  isDev:         process.env.NODE_ENV           !== 'production',
};
