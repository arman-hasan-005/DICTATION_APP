require('dotenv').config();

const REQUIRED = ['MONGODB_URI', 'JWT_SECRET'];
REQUIRED.forEach(key => {
  if (!process.env[key]) {
    console.error(`\n❌  Missing env variable: ${key}\n    Check server/.env\n`);
    process.exit(1);
  }
});

// Google Cloud TTS is optional — if missing, uploaded-content dictation
// falls back to browser speech synthesis automatically.
if (!process.env.GOOGLE_TTS_KEY) {
  console.warn('⚠️  GOOGLE_TTS_KEY not set — uploaded-content dictation will use browser voice fallback');
}

module.exports = {
  mongoURI:     process.env.MONGODB_URI,
  jwtSecret:    process.env.JWT_SECRET,
  googleTTSKey: process.env.GOOGLE_TTS_KEY || null,
  port:         parseInt(process.env.PORT, 10) || 5000,
  nodeEnv:      process.env.NODE_ENV || 'development',
  isDev:        process.env.NODE_ENV !== 'production',
};
