/**
 * Session model
 *
 * CHANGES from original:
 *   - Added compound index { user: 1, createdAt: -1 }
 *     The most common query is "get all sessions for user X sorted by date"
 *     (used by dashboard, profile, leaderboard). Without this index MongoDB
 *     does a full collection scan — becomes slow past ~10k sessions.
 *   - Added { user: 1, score: 1 } index for the "high accuracy" badge query
 *     (countDocuments where user=X and score>=90)
 */

const mongoose = require('mongoose');
const { LEVELS } = require('../utils/constants');

const sessionSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  passageId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Passage', default: null },
  passageTitle: { type: String, required: true },
  level:        { type: String, enum: Object.values(LEVELS), default: LEVELS.BEGINNER },
  totalWords:   { type: Number, default: 0 },
  correctWords: { type: Number, default: 0 },
  score:        { type: Number, min: 0, max: 100, default: 0 },
  isHandwrite:  { type: Boolean, default: false },
  sentences:    [{ original: String, answer: String, score: Number }],
  xpEarned:     { type: Number, default: 0 },
}, { timestamps: true });

// ── Compound indexes ───────────────────────────────────────────────────────────
// Primary query: "sessions for user X, newest first"
sessionSchema.index({ user: 1, createdAt: -1 });
// Badge query: "high-accuracy sessions for user X"
sessionSchema.index({ user: 1, score: 1 });
// Badge query: "handwrite sessions for user X"
sessionSchema.index({ user: 1, isHandwrite: 1 });

module.exports = mongoose.model('Session', sessionSchema);
