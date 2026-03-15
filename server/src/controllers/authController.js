const asyncHandler      = require('../utils/asyncHandler');
const authService       = require('../services/authService');
const userRepository    = require('../repositories/userRepository');
const sessionRepository = require('../repositories/sessionRepository');

const VALID_LEVELS  = ['beginner', 'intermediate', 'advanced'];
const VALID_VOICES  = ['female', 'male'];
const VALID_ACCENTS = ['american', 'british', 'indian'];

const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body);
  res.status(201).json({ ...user.toJSON(), token });
});

const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  res.status(200).json({ ...user.toJSON(), token });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.user._id);
  res.status(200).json(user);
});

const getProfile = asyncHandler(async (req, res) => {
  const user           = await userRepository.findById(req.user._id);
  const recentSessions = await sessionRepository.findByUser(req.user._id, 10);
  res.status(200).json({ user, recentSessions });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, preferredLevel, preferredVoice, preferredAccent, dictationSettings } = req.body;
  const updates = {};

  if (name?.trim())                        updates.name           = name.trim();
  if (VALID_LEVELS.includes(preferredLevel))  updates.preferredLevel = preferredLevel;
  if (VALID_VOICES.includes(preferredVoice))  updates.preferredVoice = preferredVoice;
  if (VALID_ACCENTS.includes(preferredAccent)) updates.preferredAccent = preferredAccent;

  // Classroom dictation settings
  if (dictationSettings && typeof dictationSettings === 'object') {
    const ds = {};
    if (VALID_VOICES.includes(dictationSettings.voice))   ds.voice         = dictationSettings.voice;
    if (VALID_ACCENTS.includes(dictationSettings.accent)) ds.accent        = dictationSettings.accent;
    if (typeof dictationSettings.speed === 'number')      ds.speed         = Math.min(2, Math.max(0.25, dictationSettings.speed));
    if (typeof dictationSettings.repeatCount === 'number') ds.repeatCount  = Math.min(5, Math.max(1, Math.round(dictationSettings.repeatCount)));
    if (typeof dictationSettings.pauseDuration === 'number') ds.pauseDuration = Math.min(15, Math.max(0, dictationSettings.pauseDuration));
    if (typeof dictationSettings.autoAdvance === 'boolean') ds.autoAdvance = dictationSettings.autoAdvance;
    if (Object.keys(ds).length) updates.dictationSettings = ds;
  }

  const user = await userRepository.updateById(req.user._id, updates);
  res.status(200).json({ user });
});

module.exports = { register, login, getMe, getProfile, updateProfile };
