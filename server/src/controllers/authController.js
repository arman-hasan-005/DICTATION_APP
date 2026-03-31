/**
 * authController.js
 *
 * Google signup flow (new users via state=signup):
 *
 *   Step 1 — googleCallback
 *     → upsert PendingGoogleSignup
 *     → send OTP to Google email
 *     → redirect to /google/verify-otp?st=<step_token>
 *
 *   Step 2 — googleVerifyOtp  (POST /api/auth/google/verify-otp)
 *     → verify OTP against PendingGoogleSignup
 *     → mark otpVerified: true
 *     → return step token for profile stage
 *
 *   Step 3 — googleCompleteProfile  (POST /api/auth/google/complete-profile)
 *     → verify step token (must be 'google_profile_pending')
 *     → create User with name, preferredLevel, optional password
 *     → delete PendingGoogleSignup
 *     → return full JWT
 */

const asyncHandler        = require('../utils/asyncHandler');
const authService         = require('../services/authService');
const emailService        = require('../services/emailService');
const userRepository      = require('../repositories/userRepository');
const sessionRepository   = require('../repositories/sessionRepository');
const PendingGoogleSignup = require('../models/PendingGoogleSignup');
const User                = require('../models/User');
const AppError            = require('../utils/AppError');
const { clientUrl }       = require('../config/env');

const VALID_LEVELS  = ['beginner', 'intermediate', 'advanced'];
const VALID_VOICES  = ['female', 'male'];
const VALID_ACCENTS = ['american', 'british', 'indian'];

// ── Local register ────────────────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({
    success: true,
    data: { ...result.user.toJSON(), token: result.token, requiresVerification: result.requiresVerification },
  });
});

// ── Local login ───────────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  res.status(200).json({ success: true, data: { ...user.toJSON(), token } });
});

// ── Google OAuth callback ─────────────────────────────────────────────────────
const googleCallback = asyncHandler(async (req, res) => {
  if (!req.user) return res.redirect(`${clientUrl}/login?error=google_failed`);

  const intent = req.query.state; // 'login' | 'signup'

  // ── Existing user: always log in ───────────────────────────────────────────
  if (!req.user.isNewGoogleUser) {
    const { token } = authService.googleLogin(req.user);
    return res.redirect(`${clientUrl}/auth/google/success?token=${token}`);
  }

  // ── New user via LOGIN intent: reject ──────────────────────────────────────
  if (intent === 'login') {
    return res.redirect(`${clientUrl}/login?error=google_no_account`);
  }

  // ── New user via SIGNUP intent: start 3-step verification flow ────────────
  const { googleId, email, name } = req.user;

  // Generate and send OTP
  const otp = authService.generateOtp();

  // Upsert PendingGoogleSignup (handles repeated signup attempts gracefully)
  await PendingGoogleSignup.findOneAndUpdate(
    { googleId },
    {
      googleId,
      email,
      name,
      otpHash:     await authService.hashOtp(otp),
      otpExpiry:   new Date(Date.now() + 10 * 60 * 1000),  // 10 min
      otpVerified: false,
      createdAt:   new Date(),  // reset TTL on each attempt
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await emailService.sendOtpEmail(email, name, otp);

  // Issue step-1 token and redirect to OTP page
  const stepToken = authService.generateGoogleStepToken(
    (await PendingGoogleSignup.findOne({ googleId }))._id,
    'google_otp_pending',
  );

  return res.redirect(
    `${clientUrl}/google/verify-otp?st=${encodeURIComponent(stepToken)}&email=${encodeURIComponent(email)}`
  );
});

// ── Google signup: step 2 — verify OTP ───────────────────────────────────────
const googleVerifyOtp = asyncHandler(async (req, res) => {
  const { stepToken, otp } = req.body;
  if (!stepToken || !otp) throw new AppError('Step token and OTP are required', 400);

  const decoded = authService.verifyGoogleStepToken(stepToken, 'google_otp_pending');

  const pending = await PendingGoogleSignup.findById(decoded.pendingId);
  if (!pending) throw new AppError('Session expired. Please start sign-up again.', 400);
  if (pending.otpVerified) throw new AppError('OTP already verified. Continue to profile setup.', 400);

  if (new Date() > pending.otpExpiry)
    throw new AppError('OTP has expired. Please start sign-up again.', 400);

  const match = await authService.compareOtp(String(otp).trim(), pending.otpHash);
  if (!match) throw new AppError('Incorrect OTP. Please try again.', 400);

  // Mark verified
  await PendingGoogleSignup.findByIdAndUpdate(pending._id, { otpVerified: true });

  // Issue step-2 token (profile stage)
  const profileToken = authService.generateGoogleStepToken(
    pending._id,
    'google_profile_pending',
  );

  res.status(200).json({
    success: true,
    data: {
      profileToken,
      email: pending.email,
      name:  pending.name,
      message: 'Email verified. Please complete your profile.',
    },
  });
});

// ── Google signup: step 2 — resend OTP ───────────────────────────────────────
const googleResendOtp = asyncHandler(async (req, res) => {
  const { stepToken } = req.body;
  if (!stepToken) throw new AppError('Step token is required', 400);

  const decoded = authService.verifyGoogleStepToken(stepToken, 'google_otp_pending');
  const pending = await PendingGoogleSignup.findById(decoded.pendingId);
  if (!pending) throw new AppError('Session expired. Please start sign-up again.', 400);
  if (pending.otpVerified) throw new AppError('OTP already verified.', 400);

  const otp = authService.generateOtp();
  await PendingGoogleSignup.findByIdAndUpdate(pending._id, {
    otpHash:   await authService.hashOtp(otp),
    otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
  });
  await emailService.sendOtpEmail(pending.email, pending.name, otp);

  res.status(200).json({ success: true, data: { message: 'OTP resent to your email.' } });
});

// ── Google signup: step 3 — complete profile ─────────────────────────────────
const googleCompleteProfile = asyncHandler(async (req, res) => {
  const { profileToken, name, preferredLevel, password } = req.body;

  if (!profileToken) throw new AppError('Profile token is required', 400);
  if (!name?.trim()) throw new AppError('Name is required', 400);
  if (!VALID_LEVELS.includes(preferredLevel))
    throw new AppError('Please select a valid level (beginner, intermediate, or advanced)', 400);
  if (password && password.length < 6)
    throw new AppError('Password must be at least 6 characters', 400);

  const decoded = authService.verifyGoogleStepToken(profileToken, 'google_profile_pending');

  const pending = await PendingGoogleSignup.findById(decoded.pendingId);
  if (!pending)           throw new AppError('Session expired. Please start sign-up again.', 400);
  if (!pending.otpVerified) throw new AppError('Email not verified. Please verify your OTP first.', 400);

  // Guard against duplicate email race condition
  const existing = await User.findOne({ email: pending.email });
  if (existing) {
    // Account already exists (e.g. race condition) — just log them in
    if (!existing.googleId) {
      await User.findByIdAndUpdate(existing._id, {
        googleId: pending.googleId, authProvider: 'google', isEmailVerified: true,
      });
    }
    await PendingGoogleSignup.findByIdAndDelete(pending._id);
    const { token } = authService.googleLogin(existing);
    return res.status(200).json({ success: true, data: { ...existing.toJSON(), token } });
  }

  // Build user data
  const userData = {
    name:            name.trim(),
    email:           pending.email,
    googleId:        pending.googleId,
    authProvider:    'google',
    isEmailVerified: true,
    preferredLevel,
  };
  if (password) {
    userData.password     = await authService.hashPassword(password);
    userData.authProvider = 'google'; // still google primary; local login also enabled
  }

  const user = await User.create(userData);

  // Clean up pending document
  await PendingGoogleSignup.findByIdAndDelete(pending._id);

  const token = authService.generateToken(user._id);
  res.status(201).json({ success: true, data: { ...user.toJSON(), token } });
});

// ── OTP verify (local signup) ─────────────────────────────────────────────────
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new AppError('Email and OTP are required', 400);

  const user = await userRepository.findByEmail(email);
  if (!user) throw new AppError('No account found with that email', 404);
  if (user.isEmailVerified) throw new AppError('Email is already verified', 400);

  if (!user.emailOtp || !user.emailOtpExpiry)
    throw new AppError('No active OTP. Please request a new one.', 400);
  if (new Date() > new Date(user.emailOtpExpiry))
    throw new AppError('OTP has expired. Please request a new one.', 400);

  const match = await authService.compareOtp(String(otp).trim(), user.emailOtp);
  if (!match) throw new AppError('Incorrect OTP. Please try again.', 400);

  await userRepository.updateById(user._id, {
    isEmailVerified: true, emailOtp: null, emailOtpExpiry: null,
  });

  const token = authService.generateToken(user._id);
  res.status(200).json({ success: true, data: { ...user.toJSON(), isEmailVerified: true, token } });
});

// ── OTP resend (local signup) ─────────────────────────────────────────────────
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError('Email is required', 400);

  const user = await userRepository.findByEmail(email);
  if (!user) throw new AppError('No account found with that email', 404);
  if (user.isEmailVerified) throw new AppError('Email is already verified', 400);

  const otp = authService.generateOtp();
  await userRepository.updateById(user._id, {
    emailOtp: await authService.hashOtp(otp),
    emailOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
  });
  await emailService.sendOtpEmail(email, user.name, otp);

  res.status(200).json({ success: true, data: { message: 'OTP resent to your email.' } });
});

// ── Forgot password ───────────────────────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError('Email is required', 400);
  const generic = { success: true, data: { message: 'If that email is registered, a reset link has been sent.' } };
  const user = await userRepository.findByEmail(email);
  if (!user || user.authProvider === 'google') return res.status(200).json(generic);
  const rawToken    = authService.generateResetToken();
  const hashedToken = authService.hashToken(rawToken);
  await userRepository.updateById(user._id, {
    resetPasswordToken:  hashedToken,
    resetPasswordExpiry: new Date(Date.now() + 60 * 60 * 1000),
  });
  await emailService.sendPasswordResetEmail(email, user.name, rawToken);
  res.status(200).json(generic);
});

// ── Reset password ────────────────────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) throw new AppError('Token and new password are required', 400);
  if (newPassword.length < 6) throw new AppError('Password must be at least 6 characters', 400);
  const hashedToken = authService.hashToken(token.trim());
  const user = await userRepository.findByResetToken(hashedToken);
  if (!user) throw new AppError('Invalid or expired reset link. Please request a new one.', 400);
  await userRepository.updateById(user._id, {
    password: await authService.hashPassword(newPassword),
    resetPasswordToken: null, resetPasswordExpiry: null,
  });
  res.status(200).json({ success: true, data: { message: 'Password updated successfully. Please log in.' } });
});

// ── Change password ───────────────────────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    throw new AppError('Both currentPassword and newPassword are required', 400);
  if (newPassword.length < 6) throw new AppError('New password must be at least 6 characters', 400);
  const user = await userRepository.findByEmailWithPassword(req.user.email);
  if (!user) throw new AppError('User not found', 404);
  if (user.authProvider === 'google' && !user.password)
    throw new AppError('Google accounts cannot use this method.', 400);
  const match = await authService.comparePassword(currentPassword, user.password);
  if (!match) throw new AppError('Current password is incorrect', 401);
  await userRepository.updateById(user._id, { password: await authService.hashPassword(newPassword) });
  res.status(200).json({ success: true, data: { message: 'Password changed successfully.' } });
});

// ── Profile ───────────────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.user._id);
  res.status(200).json({ success: true, data: user });
});

const getProfile = asyncHandler(async (req, res) => {
  const user           = await userRepository.findById(req.user._id);
  const recentSessions = await sessionRepository.findByUser(req.user._id, 10);
  res.status(200).json({ success: true, data: { user, recentSessions } });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, preferredLevel, preferredVoice, preferredAccent, dictationSettings } = req.body;
  const updates = {};
  if (name?.trim())                            updates.name            = name.trim();
  if (VALID_LEVELS.includes(preferredLevel))   updates.preferredLevel  = preferredLevel;
  if (VALID_VOICES.includes(preferredVoice))   updates.preferredVoice  = preferredVoice;
  if (VALID_ACCENTS.includes(preferredAccent)) updates.preferredAccent = preferredAccent;
  if (dictationSettings && typeof dictationSettings === 'object') {
    const ds = {};
    if (VALID_VOICES.includes(dictationSettings.voice))       ds.voice         = dictationSettings.voice;
    if (VALID_ACCENTS.includes(dictationSettings.accent))     ds.accent        = dictationSettings.accent;
    if (typeof dictationSettings.speed === 'number')          ds.speed         = Math.min(2, Math.max(0.25, dictationSettings.speed));
    if (typeof dictationSettings.repeatCount === 'number')    ds.repeatCount   = Math.min(5, Math.max(1, Math.round(dictationSettings.repeatCount)));
    if (typeof dictationSettings.pauseDuration === 'number')  ds.pauseDuration = Math.min(15, Math.max(0, dictationSettings.pauseDuration));
    if (typeof dictationSettings.autoAdvance === 'boolean')   ds.autoAdvance   = dictationSettings.autoAdvance;
    if (Object.keys(ds).length) updates.dictationSettings = ds;
  }
  const user = await userRepository.updateById(req.user._id, updates);
  res.status(200).json({ success: true, data: { user } });
});

module.exports = {
  register, login,
  googleCallback, googleVerifyOtp, googleResendOtp, googleCompleteProfile,
  verifyOtp, resendOtp,
  forgotPassword, resetPassword, changePassword,
  getMe, getProfile, updateProfile,
};
