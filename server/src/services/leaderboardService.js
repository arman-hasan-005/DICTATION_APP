const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');
const VALID = { xp:'xp', streak:'streak', sessions:'totalSessions' };

const leaderboardService = {
  get: async (type='xp') => {
    const sortField = VALID[type];
    if (!sortField) throw new AppError('Invalid leaderboard type', 400);
    const leaderboard = await userRepository.getLeaderboard(sortField, 50);
    return { leaderboard, type };
  },
};
module.exports = leaderboardService;
