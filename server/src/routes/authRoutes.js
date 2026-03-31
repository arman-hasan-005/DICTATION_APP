/**
 * authRoutes.js
 *
 * Google signup flow endpoints:
 *   GET  /google/signup             → initiate, state='signup'
 *   GET  /google/login              → initiate, state='login'
 *   GET  /google/callback           → shared callback
 *   POST /google/verify-otp         → step 2: verify OTP
 *   POST /google/resend-otp         → step 2: resend OTP
 *   POST /google/complete-profile   → step 3: save profile, create account
 */

const router   = require('express').Router();
const passport = require('../config/passport');
const {
  register, login,
  googleCallback, googleVerifyOtp, googleResendOtp, googleCompleteProfile,
  verifyOtp, resendOtp,
  forgotPassword, resetPassword, changePassword,
  getMe, getProfile, updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const {
  validate, registerRules, loginRules,
  otpRules, forgotPasswordRules, resetPasswordRules,
} = require('../middlewares/validate');
const { googleClientId, clientUrl } = require('../config/env');

// ── Local ─────────────────────────────────────────────────────────────────────
router.post('/register', registerRules, validate, register);
router.post('/login',    loginRules,    validate, login);

// ── Google OAuth ──────────────────────────────────────────────────────────────
if (googleClientId) {
  const SCOPE            = { scope: ['profile', 'email'], session: false };
  const FAILURE_REDIRECT = `${clientUrl}/login?error=google_failed`;

  router.get('/google/login',
    passport.authenticate('google', { ...SCOPE, state: 'login' }),
  );
  router.get('/google/signup',
    passport.authenticate('google', { ...SCOPE, state: 'signup' }),
  );
  router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: FAILURE_REDIRECT }),
    googleCallback,
  );
} else {
  const stub = (req, res) =>
    res.status(503).json({ success: false, message: 'Google OAuth is not configured.' });
  router.get('/google/login',    stub);
  router.get('/google/signup',   stub);
  router.get('/google/callback', stub);
}

// Google signup multi-step endpoints (no auth required)
router.post('/google/verify-otp',       googleVerifyOtp);
router.post('/google/resend-otp',       googleResendOtp);
router.post('/google/complete-profile', googleCompleteProfile);

// ── Local OTP ─────────────────────────────────────────────────────────────────
router.post('/otp/verify', otpRules,            validate, verifyOtp);
router.post('/otp/resend', forgotPasswordRules,  validate, resendOtp);

// ── Password reset ────────────────────────────────────────────────────────────
router.post('/forgot-password', forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password',  resetPasswordRules,  validate, resetPassword);

// ── Authenticated ─────────────────────────────────────────────────────────────
router.get('/me',       protect, getMe);
router.get('/profile',  protect, getProfile);
router.put('/profile',  protect, updateProfile);
router.put('/password', protect, changePassword);

module.exports = router;
