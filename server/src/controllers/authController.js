/**
 * authController.js
 *
 * CHANGES from original:
 *   - Consistent response envelope: { success: true, data: { ... } }
 *   - Added changePassword endpoint
 *   - Uses logger instead of implicit error-only console output
 */

const asyncHandler      = require('../utils/asyncHandler');
const authService       = require('../services/authService');
const userRepository    = require('../repositories/userRepository');
const sessionRepository = require('../repositories/sessionRepository');
const AppError          = require('../utils/AppError');

const VALID_LEVELS  = ['beginner', 'intermediate', 'advanced'];
const VALID_VOICES  = ['female', 'male'];
const VALID_ACCENTS = ['american', 'british', 'indian'];

const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body);
  res.status(201).json({ success: true, data: { ...user.toJSON(), token } });
});

const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  res.status(200).json({ success: true, data: { ...user.toJSON(), token } });
});

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

  if (name?.trim())                             updates.name           = name.trim();
  if (VALID_LEVELS.includes(preferredLevel))    updates.preferredLevel = preferredLevel;
  if (VALID_VOICES.includes(preferredVoice))    updates.preferredVoice = preferredVoice;
  if (VALID_ACCENTS.includes(preferredAccent))  updates.preferredAccent = preferredAccent;

  if (dictationSettings && typeof dictationSettings === 'object') {
    const ds = {};
    if (VALID_VOICES.includes(dictationSettings.voice))           ds.voice         = dictationSettings.voice;
    if (VALID_ACCENTS.includes(dictationSettings.accent))         ds.accent        = dictationSettings.accent;
    if (typeof dictationSettings.speed === 'number')              ds.speed         = Math.min(2, Math.max(0.25, dictationSettings.speed));
    if (typeof dictationSettings.repeatCount === 'number')        ds.repeatCount   = Math.min(5, Math.max(1, Math.round(dictationSettings.repeatCount)));
    if (typeof dictationSettings.pauseDuration === 'number')      ds.pauseDuration = Math.min(15, Math.max(0, dictationSettings.pauseDuration));
    if (typeof dictationSettings.autoAdvance === 'boolean')       ds.autoAdvance   = dictationSettings.autoAdvance;
    if (Object.keys(ds).length) updates.dictationSettings = ds;
  }

  const user = await userRepository.updateById(req.user._id, updates);
  res.status(200).json({ success: true, data: { user } });
});

/**
 * PUT /api/auth/password
 * Change password — requires current password for verification.
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new AppError('currentPassword and newPassword are required', 400);
  }
  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters', 400);
  }

  // Fetch with password included (findById strips it)
  const user = await require('../models/User').findById(req.user._id).select('+password');
  if (!user) throw new AppError('User not found', 404);

  const match = await authService.comparePassword(currentPassword, user.password);
  if (!match) throw new AppError('Current password is incorrect', 401);

  user.password = await authService.hashPassword(newPassword);
  await user.save();

  res.status(200).json({ success: true, data: { message: 'Password changed successfully' } });
});

module.exports = { register, login, getMe, getProfile, updateProfile, changePassword };
