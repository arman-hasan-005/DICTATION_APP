const Session = require('../models/Session');

const LIST_SELECT = 'passageTitle level score xpEarned correctWords totalWords isHandwrite createdAt passageId';

const sessionRepository = {
  create: (data) => Session.create(data),

  /** Paginated session list for a user, newest first */
  findByUser: (userId, limit = 20, skip = 0) =>
    Session.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select(LIST_SELECT),

  /** Total count of sessions for a user (for pagination meta) */
  countByUser: (userId) =>
    Session.countDocuments({ user: userId }),

  /** Full session with sentences (detail view) */
  findById: (id) => Session.findById(id),

  countHighAccuracy: (userId) =>
    Session.countDocuments({ user: userId, score: { $gte: 90 } }),

  countHandwrite: (userId) =>
    Session.countDocuments({ user: userId, isHandwrite: true }),

  /**
   * Daily aggregated stats for the sparkline chart.
   * Returns [{date, avgScore, totalWords, correctWords, sessions, xpEarned}]
   */
  getDailyStats: (userId, days = 30) => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    return Session.aggregate([
      { $match: { user: userId, createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            year:  { $year:  '$createdAt' },
            month: { $month: '$createdAt' },
            day:   { $dayOfMonth: '$createdAt' },
          },
          avgScore:     { $avg: '$score' },
          totalWords:   { $sum: '$totalWords' },
          correctWords: { $sum: '$correctWords' },
          sessions:     { $sum: 1 },
          xpEarned:     { $sum: '$xpEarned' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year:  '$_id.year',
              month: '$_id.month',
              day:   '$_id.day',
            },
          },
          avgScore:     { $round: ['$avgScore', 1] },
          totalWords:   1,
          correctWords: 1,
          sessions:     1,
          xpEarned:     1,
        },
      },
    ]);
  },

  /**
   * Breakdown by level: count, avgScore, accuracy per level.
   */
  getLevelBreakdown: (userId) =>
    Session.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id:          '$level',
          count:        { $sum: 1 },
          avgScore:     { $avg: '$score' },
          totalWords:   { $sum: '$totalWords' },
          correctWords: { $sum: '$correctWords' },
        },
      },
      {
        $project: {
          _id: 0,
          level:        '$_id',
          count:        1,
          avgScore:     { $round: ['$avgScore', 1] },
          totalWords:   1,
          correctWords: 1,
          accuracy: {
            $cond: [
              { $gt: ['$totalWords', 0] },
              { $round: [{ $multiply: [{ $divide: ['$correctWords', '$totalWords'] }, 100] }, 1] },
              0,
            ],
          },
        },
      },
      { $sort: { count: -1 } },
    ]),

  /**
   * All-time accuracy aggregated directly from Session documents.
   * This is the authoritative source used by both Dashboard and History
   * so they always show the same number.
   * Returns { totalWords, totalCorrectWords, accuracy, sessions }
   */
  getOverallAccuracy: async (userId) => {
    const result = await Session.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id:          null,
          totalWords:   { $sum: '$totalWords' },
          correctWords: { $sum: '$correctWords' },
          sessions:     { $sum: 1 },
        },
      },
    ]);
    if (!result.length) {
      return { totalWords: 0, totalCorrectWords: 0, accuracy: 0, sessions: 0 };
    }
    const { totalWords, correctWords, sessions } = result[0];
    const accuracy = totalWords > 0
      ? Math.round((correctWords / totalWords) * 100)
      : 0;
    return { totalWords, totalCorrectWords: correctWords, accuracy, sessions };
  },
};

module.exports = sessionRepository;
