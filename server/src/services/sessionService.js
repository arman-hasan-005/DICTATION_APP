const sessionRepository = require('../repositories/sessionRepository');
const userRepository    = require('../repositories/userRepository');
const { BADGES, XP_MULTIPLIERS, BASE_XP_RATE } = require('../utils/constants');

const calculateXP = (score, totalWords, level) => {
  const multiplier = XP_MULTIPLIERS[level] || 1.0;
  const base = Math.round((score / 100) * totalWords * BASE_XP_RATE);
  return Math.max(1, Math.round(base * multiplier));
};

const calculateStreak = (user) => {
  const today      = new Date(); today.setHours(0,0,0,0);
  const lastActive = user.lastActiveDate ? new Date(new Date(user.lastActiveDate).setHours(0,0,0,0)) : null;
  if (!lastActive) return { streak:1, longestStreak: Math.max(1, user.longestStreak||0), lastActiveDate: today };
  const diff = Math.round((today - lastActive) / 86400000);
  const newStreak = diff === 0 ? user.streak : diff === 1 ? (user.streak||0)+1 : 1;
  return { streak: newStreak, longestStreak: Math.max(newStreak, user.longestStreak||0), lastActiveDate: today };
};

const checkNewBadges = async (user, data, xpAfter) => {
  const earned    = new Set(user.badges.map(b => b.id));
  const newBadges = [];
  const award = (b) => { if (!earned.has(b.id)) { newBadges.push({ ...b, earnedAt: new Date() }); earned.add(b.id); } };

  if ((user.totalSessions||0)+1 === 1)         award(BADGES.FIRST_STEP);
  if (data.score === 100)                       award(BADGES.PERFECT_SCORE);
  if (xpAfter >= 100)                           award(BADGES.XP_100);
  if (xpAfter >= 500)                           award(BADGES.XP_500);
  if (xpAfter >= 1000)                          award(BADGES.XP_1000);
  const s = user.streak || 0;
  if (s >= 3)  award(BADGES.STREAK_3);
  if (s >= 7)  award(BADGES.STREAK_7);
  if (s >= 30) award(BADGES.STREAK_30);
  const sessions = (user.totalSessions||0)+1;
  if (sessions >= 10) award(BADGES.SESSIONS_10);
  if (sessions >= 50) award(BADGES.SESSIONS_50);
  const highCount = await sessionRepository.countHighAccuracy(user._id);
  if (highCount + (data.score >= 90 ? 1 : 0) >= 5) award(BADGES.HIGH_ACCURACY);
  const hwCount = await sessionRepository.countHandwrite(user._id);
  if (hwCount + (data.isHandwrite ? 1 : 0) >= 5)   award(BADGES.HANDWRITER);
  return newBadges;
};

const processSession = async (userId, data) => {
  const user      = await userRepository.findById(userId);
  const xpEarned  = calculateXP(data.score, data.totalWords, data.level);
  const { streak, longestStreak, lastActiveDate } = calculateStreak(user);

  const session = await sessionRepository.create({
    user: userId, passageId: data.passageId||null,
    passageTitle: data.passageTitle, level: data.level||'beginner',
    totalWords: data.totalWords||0, correctWords: data.correctWords||0,
    score: data.score||0, isHandwrite: data.isHandwrite||false,
    sentences: data.sentences||[], xpEarned,
  });

  let updatedUser = await userRepository.updateStats(userId, {
    xp: xpEarned, totalWords: data.totalWords||0, correctWords: data.correctWords||0,
    streak, longestStreak, lastActiveDate,
  });

  const newBadges = await checkNewBadges({ ...user.toObject(), streak }, data, (user.xp||0)+xpEarned);
  for (const badge of newBadges) {
    updatedUser = await userRepository.addBadge(userId, badge);
  }

  return { session, xpEarned, newBadges, updatedUser };
};

module.exports = { processSession, calculateXP };
