/**
 * leaderboardController.js — Consistent { success, data } responses
 */
const asyncHandler       = require('../utils/asyncHandler');
const leaderboardService = require('../services/leaderboardService');

const getLeaderboard = asyncHandler(async (req, res) => {
  const result = await leaderboardService.get(req.query.type || 'xp');
  res.status(200).json({ success: true, data: result });
});

module.exports = { getLeaderboard };
