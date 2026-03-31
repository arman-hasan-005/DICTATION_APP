/**
 * sessionController.js — Consistent { success, data } responses
 */
const asyncHandler       = require('../utils/asyncHandler');
const { processSession } = require('../services/sessionService');
const sessionRepository  = require('../repositories/sessionRepository');
const AppError           = require('../utils/AppError');

const saveSession = asyncHandler(async (req, res) => {
  const result = await processSession(req.user._id, req.body);
  res.status(201).json({ success: true, data: result });
});

const getSessions = asyncHandler(async (req, res) => {
  const sessions = await sessionRepository.findByUser(req.user._id);
  res.status(200).json({ success: true, data: sessions });
});

const getSessionById = asyncHandler(async (req, res) => {
  const session = await sessionRepository.findById(req.params.id);
  if (!session) throw new AppError('Session not found', 404);
  // Ensure users can only access their own sessions
  if (session.user.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorised to view this session', 403);
  }
  res.status(200).json({ success: true, data: session });
});

module.exports = { saveSession, getSessions, getSessionById };
