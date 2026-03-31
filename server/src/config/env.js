require('dotenv').config();

const REQUIRED = ['MONGODB_URI', 'JWT_SECRET'];
REQUIRED.forEach((key) => {
  if (!process.env[key]) {
    console.error(`\n❌  Missing env variable: ${key}\n    Check server/.env\n`);
    process.exit(1);
  }
});

if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
  console.error('\n❌  JWT_SECRET must be at least 32 characters in production\n');
  process.exit(1);
}

// Warn on missing optional vars
const optionalWarnings = {
  GOOGLE_TTS_KEY:      '⚠️  GOOGLE_TTS_KEY not set — browser voice fallback will be used',
  GOOGLE_VISION_KEY:   '⚠️  GOOGLE_VISION_KEY not set — handwriting OCR will use Tesseract.js fallback',
  GOOGLE_CLIENT_ID:    '⚠️  GOOGLE_CLIENT_ID not set — Google OAuth will be disabled',
  GOOGLE_CLIENT_SECRET:'⚠️  GOOGLE_CLIENT_SECRET not set — Google OAuth will be disabled',
  SMTP_USER:           '⚠️  SMTP_USER not set — OTP emails will not be sent',
  SMTP_PASS:           '⚠️  SMTP_PASS not set — OTP emails will not be sent',
};
Object.entries(optionalWarnings).forEach(([key, msg]) => {
  if (!process.env[key]) console.warn(msg);
});

module.exports = {
  mongoURI:           process.env.MONGODB_URI,
  jwtSecret:          process.env.JWT_SECRET,
  googleTTSKey:       process.env.GOOGLE_TTS_KEY          || null,
  googleVisionKey:    process.env.GOOGLE_VISION_KEY       || null,   // ← NEW
  ttsServiceUrl:      process.env.TTS_SERVICE_URL          || 'http://localhost:5001',
  clientUrl:          process.env.CLIENT_URL               || 'http://localhost:5173',
  port:               parseInt(process.env.PORT, 10)       || 5000,
  nodeEnv:            process.env.NODE_ENV                 || 'development',
  isDev:              process.env.NODE_ENV                 !== 'production',
  googleClientId:     process.env.GOOGLE_CLIENT_ID         || null,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET     || null,
  smtpHost:           process.env.SMTP_HOST                || 'smtp.gmail.com',
  smtpPort:           parseInt(process.env.SMTP_PORT, 10)  || 587,
  smtpUser:           process.env.SMTP_USER                || null,
  smtpPass:           process.env.SMTP_PASS                || null,
  emailFrom:          process.env.EMAIL_FROM               || process.env.SMTP_USER || 'noreply@dictaclass.com',
};
