const asyncHandler       = require('../utils/asyncHandler');
const { processSession } = require('../services/sessionService');
const sessionRepository  = require('../repositories/sessionRepository');

const saveSession = asyncHandler(async (req, res) => {
  const result = await processSession(req.user._id, req.body);
  res.status(201).json(result);
});

const getSessions = asyncHandler(async (req, res) => {
  const sessions = await sessionRepository.findByUser(req.user._id);
  res.status(200).json(sessions);
});

const getSessionById = asyncHandler(async (req, res) => {
  const session = await sessionRepository.findById(req.params.id);
  if (!session) return res.status(404).json({ message:'Session not found' });
  res.status(200).json(session);
});

module.exports = { saveSession, getSessions, getSessionById };
