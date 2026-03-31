/**
 * authService.js
 */

const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const { jwtSecret } = require('../config/env');
const AppError       = require('../utils/AppError');
const userRepository = require('../repositories/userRepository');
const emailService   = require('./emailService');

const authService = {

  // ── Core helpers ────────────────────────────────────────────────────────────

  hashPassword:    async (p) => { const s = await bcrypt.genSalt(10); return bcrypt.hash(p, s); },
  comparePassword: (p, h)    => bcrypt.compare(p, h),

  generateToken: (userId) => jwt.sign({ id: userId }, jwtSecret, { expiresIn: '30d' }),
  verifyToken:   (token)  => jwt.verify(token, jwtSecret),

  generateOtp: () =>
    String(Number(crypto.randomBytes(3).readUIntBE(0, 3)) % 1_000_000).padStart(6, '0'),

  hashOtp:    async (otp) => { const s = await bcrypt.genSalt(8); return bcrypt.hash(otp, s); },
  compareOtp: (plain, hash) => bcrypt.compare(plain, hash),

  generateResetToken: () => crypto.randomBytes(64).toString('hex'),
  hashToken: (raw) => crypto.createHash('sha256').update(raw).digest('hex'),

  // ── Google signup step tokens ───────────────────────────────────────────────

  /**
   * Short-lived JWT that carries the PendingGoogleSignup _id between
   * the OTP page and the profile-completion page.
   * Expires in 15 minutes.
   *
   * @param {string} pendingId  — PendingGoogleSignup._id (string)
   * @param {string} purpose    — 'google_otp_pending' | 'google_profile_pending'
   */
  generateGoogleStepToken: (pendingId, purpose) =>
    jwt.sign({ purpose, pendingId: String(pendingId) }, jwtSecret, { expiresIn: '15m' }),

  /**
   * Verify a Google step token and assert its purpose.
   * Throws AppError on failure.
   */
  verifyGoogleStepToken: (token, expectedPurpose) => {
    try {
      const decoded = jwt.verify(token, jwtSecret);
      if (decoded.purpose !== expectedPurpose) {
        throw new AppError('Invalid or wrong-step token', 400);
      }
      return decoded;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Session expired. Please start the sign-up again.', 400);
    }
  },

  googleLogin: (user) => ({ token: authService.generateToken(user._id) }),

  // ── Local register ──────────────────────────────────────────────────────────

  register: async ({ name, email, password, preferredLevel }) => {
    const exists = await userRepository.findByEmail(email);
    if (exists) {
      if (!exists.isEmailVerified) {
        const otp = authService.generateOtp();
        await userRepository.updateById(exists._id, {
          emailOtp:       await authService.hashOtp(otp),
          emailOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
        });
        await emailService.sendOtpEmail(email, exists.name, otp);
        return { user: exists, token: null, requiresVerification: true };
      }
      throw new AppError('An account with that email already exists', 400);
    }

    const otp  = authService.generateOtp();
    const user = await userRepository.create({
      name,
      email,
      password:        await authService.hashPassword(password),
      preferredLevel:  preferredLevel || 'beginner',
      authProvider:    'local',
      isEmailVerified: false,
      emailOtp:        await authService.hashOtp(otp),
      emailOtpExpiry:  new Date(Date.now() + 10 * 60 * 1000),
    });

    await emailService.sendOtpEmail(email, name, otp);
    return { user, token: null, requiresVerification: true };
  },

  // ── Local login ─────────────────────────────────────────────────────────────

  login: async ({ email, password }) => {
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) throw new AppError('Invalid email or password', 401);

    if (user.authProvider === 'google' && !user.password) {
      throw new AppError('This account uses Google Sign-In. Please log in with Google.', 401);
    }

    const match = await authService.comparePassword(password, user.password);
    if (!match) throw new AppError('Invalid email or password', 401);

    if (!user.isEmailVerified) {
      const otp = authService.generateOtp();
      await userRepository.updateById(user._id, {
        emailOtp:       await authService.hashOtp(otp),
        emailOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      });
      await emailService.sendOtpEmail(email, user.name, otp);
      throw new AppError('EMAIL_NOT_VERIFIED', 403);
    }

    return { user, token: authService.generateToken(user._id) };
  },
};

module.exports = authService;
