const User = require('../models/User');
const userRepository = {
  findById:            (id)  => User.findById(id).select('-password'),
  findByEmail:         (email) => User.findOne({ email }),
  create:              (data)  => User.create(data),
  updateById:          (id, u) => User.findByIdAndUpdate(id, { $set: u }, { new:true }).select('-password'),
  updateStats: (id, { xp, totalWords, correctWords, streak, longestStreak, lastActiveDate }) =>
    User.findByIdAndUpdate(id, {
      $inc: { xp, totalSessions:1, totalWords, totalCorrectWords: correctWords },
      $set: { streak, longestStreak, lastActiveDate },
    }, { new:true }).select('-password'),
  addBadge: (id, badge) => User.findByIdAndUpdate(id, { $push:{ badges:badge } }, { new:true }).select('-password'),
  getLeaderboard: (sortField='xp', limit=50) =>
    User.find({}).select('name xp streak totalSessions').sort({ [sortField]:-1 }).limit(limit),
};
module.exports = userRepository;
