const Session = require('../models/Session');
const sessionRepository = {
  create:           (data)          => Session.create(data),
  findByUser:       (userId, n=20)  => Session.find({ user:userId }).sort({ createdAt:-1 }).limit(n).select('passageTitle level score xpEarned correctWords totalWords isHandwrite createdAt'),
  findById:         (id)            => Session.findById(id),
  countHighAccuracy:(userId)        => Session.countDocuments({ user:userId, score:{ $gte:90 } }),
  countHandwrite:   (userId)        => Session.countDocuments({ user:userId, isHandwrite:true }),
};
module.exports = sessionRepository;
