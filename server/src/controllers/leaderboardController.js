/**
 * leaderboardController.js
 *
 * FIX: passes the requesting user's ID to leaderboardService.get() so
 * the service can compute that user's rank and return their entry even
 * if they are outside the top 50.
 */
const asyncHandler       = require('../utils/asyncHandler');
const leaderboardService = require('../services/leaderboardService');

const getLeaderboard = asyncHandler(async (req, res) => {
  const result = await leaderboardService.get(
    req.query.type || 'xp',
    req.user._id,               // ← pass requesting user for rank context
  );
  res.status(200).json({ success: true, data: result });
});

module.exports = { getLeaderboard };
