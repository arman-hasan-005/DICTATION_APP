/**
 * sessionController.js
 *
 * POST  /api/sessions          — save a completed session
 * GET   /api/sessions          — list sessions (paginated)
 * GET   /api/sessions/stats    — analytics: daily trend + level breakdown
 * GET   /api/sessions/:id      — full session detail
 */

const asyncHandler       = require('../utils/asyncHandler');
const { processSession } = require('../services/sessionService');
const sessionRepository  = require('../repositories/sessionRepository');
const AppError           = require('../utils/AppError');

// ── Save ──────────────────────────────────────────────────────────────────────
const saveSession = asyncHandler(async (req, res) => {
  const result = await processSession(req.user._id, req.body);
  res.status(201).json({ success: true, data: result });
});

// ── List (paginated) ──────────────────────────────────────────────────────────
const getSessions = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const page  = Math.max(parseInt(req.query.page,  10) || 1,  1);
  const skip  = (page - 1) * limit;

  const [sessions, total] = await Promise.all([
    sessionRepository.findByUser(req.user._id, limit, skip),
    sessionRepository.countByUser(req.user._id),
  ]);

  res.status(200).json({
    success: true,
    data: {
      sessions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: skip + sessions.length < total,
      },
    },
  });
});

// ── Analytics / stats ─────────────────────────────────────────────────────────
const getStats = asyncHandler(async (req, res) => {
  const days = Math.min(parseInt(req.query.days, 10) || 30, 365);

  const [daily, levels, overall] = await Promise.all([
    sessionRepository.getDailyStats(req.user._id, days),
    sessionRepository.getLevelBreakdown(req.user._id),
    sessionRepository.getOverallAccuracy(req.user._id),
  ]);

  // Compute a simple trend: compare avg score this week vs last week
  const now       = Date.now();
  const oneWeek   = 7 * 24 * 60 * 60 * 1000;
  const thisWeek  = daily.filter(d => new Date(d.date).getTime() >= now - oneWeek);
  const lastWeek  = daily.filter(d => {
    const t = new Date(d.date).getTime();
    return t >= now - 2 * oneWeek && t < now - oneWeek;
  });
  const avg = (arr) => arr.length
    ? Math.round(arr.reduce((s, d) => s + d.avgScore, 0) / arr.length * 10) / 10
    : null;

  res.status(200).json({
    success: true,
    data: {
      daily,          // [{date, avgScore, totalWords, correctWords, sessions, xpEarned}]
      levels,         // [{level, count, avgScore, totalWords, correctWords, accuracy}]
      overall,        // {totalWords, totalCorrectWords, accuracy, sessions} — all-time
      trend: {
        thisWeekAvg: avg(thisWeek),
        lastWeekAvg: avg(lastWeek),
        direction:   avg(thisWeek) === null || avg(lastWeek) === null ? 'neutral'
          : avg(thisWeek) > avg(lastWeek) ? 'up'
          : avg(thisWeek) < avg(lastWeek) ? 'down'
          : 'flat',
      },
    },
  });
});

// ── Detail ────────────────────────────────────────────────────────────────────
const getSessionById = asyncHandler(async (req, res) => {
  const session = await sessionRepository.findById(req.params.id);
  if (!session) throw new AppError('Session not found', 404);
  if (session.user.toString() !== req.user._id.toString())
    throw new AppError('Not authorised to view this session', 403);
  res.status(200).json({ success: true, data: session });
});

module.exports = { saveSession, getSessions, getStats, getSessionById };
