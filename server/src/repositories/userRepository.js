/**
 * userRepository.js
 */
const User = require('../models/User');

const userRepository = {
  findById:    (id)    => User.findById(id).select('-password'),
  findByEmail: (email) => User.findOne({ email }),
  findByEmailWithPassword: (email) => User.findOne({ email }).select('+password'),
  findByResetToken: (hashedToken) =>
    User.findOne({
      resetPasswordToken:  hashedToken,
      resetPasswordExpiry: { $gt: new Date() },
    }),

  create:    (data) => User.create(data),
  updateById:(id, u) => User.findByIdAndUpdate(id, { $set: u }, { new: true }).select('-password'),

  updateStats: (id, { xp, totalWords, correctWords, streak, longestStreak, lastActiveDate }) =>
    User.findByIdAndUpdate(id, {
      $inc: { xp, totalSessions: 1, totalWords, totalCorrectWords: correctWords },
      $set: { streak, longestStreak, lastActiveDate },
    }, { new: true }).select('-password'),

  addBadge: (id, badge) =>
    User.findByIdAndUpdate(id, { $push: { badges: badge } }, { new: true }).select('-password'),

  /**
   * Leaderboard query.
   *
   * FIX: added totalWords + totalCorrectWords to the select so accuracy
   * can be computed per entry client-side. Also selects _id explicitly
   * (Mongoose includes it by default, but being explicit avoids confusion
   * if projection rules change).
   *
   * For "sessions outside top 50": the controller appends the current
   * user's own row separately via findLeaderboardRank().
   */
  getLeaderboard: (sortField = 'xp', limit = 50) =>
    User.find({})
      .select('name xp streak totalSessions totalWords totalCorrectWords')
      .sort({ [sortField]: -1, _id: 1 })   // secondary sort by _id for stable ordering
      .limit(limit),

  /**
   * Find a user's rank for a given sort field (1-based).
   * Used to show users their rank even if outside the top 50.
   */
  findLeaderboardRank: async (userId, sortField = 'xp') => {
    const user = await User.findById(userId).select(`${sortField} _id`);
    if (!user) return null;
    const value = user[sortField] ?? 0;
    // Count how many users have a strictly higher value
    const rank = await User.countDocuments({ [sortField]: { $gt: value } });
    return { user, rank: rank + 1 };
  },
};

module.exports = userRepository;
