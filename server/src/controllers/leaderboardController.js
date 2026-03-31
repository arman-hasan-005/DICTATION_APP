const asyncHandler       = require('../utils/asyncHandler');
const leaderboardService = require('../services/leaderboardService');
const getLeaderboard = asyncHandler(async (req, res) => {
  res.json(await leaderboardService.get(req.query.type || 'xp'));
});
module.exports = { getLeaderboard };
