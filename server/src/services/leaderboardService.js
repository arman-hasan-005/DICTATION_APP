/**
 * leaderboardService.js
 *
 * FIX: returns the requesting user's own rank+row when they fall outside
 * the top-50 list, so the client can always show "Your rank: #87" even
 * if the user isn't visible in the main table.
 *
 * Response shape:
 * {
 *   leaderboard: [...],    // top-50 (or fewer) with accuracy computed
 *   type:        string,
 *   myEntry:     object|null,  // user's own row if not already in list
 *   myRank:      number|null,  // 1-based rank, null if user unknown
 * }
 */
const userRepository = require('../repositories/userRepository');
const AppError       = require('../utils/AppError');

const VALID = {
  xp:       'xp',
  streak:   'streak',
  sessions: 'totalSessions',
};

// Compute accuracy percentage from raw totals
const computeAccuracy = (entry) => {
  const raw    = entry.toObject ? entry.toObject() : entry;
  const total  = raw.totalWords   ?? 0;
  const correct= raw.totalCorrectWords ?? 0;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { ...raw, accuracy };
};

const leaderboardService = {
  get: async (type = 'xp', requestingUserId = null) => {
    const sortField = VALID[type];
    if (!sortField) throw new AppError('Invalid leaderboard type', 400);

    const rows = await userRepository.getLeaderboard(sortField, 50);
    const leaderboard = rows.map((e, i) => ({
      ...computeAccuracy(e),
      rank: i + 1,
    }));

    // Check if requesting user is already in the list
    const userIdStr  = requestingUserId?.toString();
    const inList     = userIdStr
      ? leaderboard.some(e => e._id?.toString() === userIdStr)
      : true;

    let myEntry = null;
    let myRank  = null;

    if (userIdStr) {
      const found = leaderboard.find(e => e._id?.toString() === userIdStr);
      if (found) {
        myRank = found.rank;
      } else {
        // User is outside top 50 — find their actual rank
        const rankData = await userRepository.findLeaderboardRank(requestingUserId, sortField);
        if (rankData) {
          myEntry = {
            ...computeAccuracy(rankData.user),
            rank: rankData.rank,
          };
          myRank = rankData.rank;
        }
      }
    }

    return { leaderboard, type, myEntry, myRank };
  },
};

module.exports = leaderboardService;
