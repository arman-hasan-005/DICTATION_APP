/**
 * passageController.js
 *
 * CHANGES from original:
 *   - Consistent { success: true, data: ... } response envelope on all routes
 *   - Uses logger instead of console.warn
 */

const asyncHandler    = require('../utils/asyncHandler');
const passageService  = require('../services/passageService');
const googleTTS       = require('../config/googleTTS');
const AppError        = require('../utils/AppError');
const logger          = require('../config/logger');

// ── Standard passage CRUD ─────────────────────────────────────────────────────

const getPassages = asyncHandler(async (req, res) => {
  const passages = await passageService.getAll({ level: req.query.level });
  res.status(200).json({ success: true, data: passages });
});

const getRandomPassage = asyncHandler(async (req, res) => {
  const passage = await passageService.getRandom(req.query.level);
  res.status(200).json({ success: true, data: passage });
});

const getPassageById = asyncHandler(async (req, res) => {
  const passage = await passageService.getById(req.params.id);
  res.status(200).json({ success: true, data: passage });
});

const createPassage = asyncHandler(async (req, res) => {
  const passage = await passageService.create(req.body);
  res.status(201).json({ success: true, data: passage });
});

// ── TTS status ────────────────────────────────────────────────────────────────

const ttsStatus = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      googleTTS: googleTTS.isConfigured(),
      voices:    googleTTS.isConfigured() ? googleTTS.VOICE_NAMES : null,
    },
  });
});

// ── Google TTS for uploaded content ──────────────────────────────────────────

const generateTTS = asyncHandler(async (req, res) => {
  const { text, voice = 'female', accent = 'american' } = req.body;
  if (!text?.trim()) throw new AppError('Text is required', 400);

  if (!googleTTS.isConfigured()) {
    return res.status(200).json({
      success:  true,
      fallback: true,
      reason:   'Google TTS not configured — use browser speech',
      text:     text.trim(),
    });
  }

  try {
    const audioBuffer = await googleTTS.generateSpeech(text.trim(), voice, accent);
    res.set({
      'Content-Type':   'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control':  'no-store',
      'X-Voice':        voice,
      'X-Accent':       accent,
    });
    return res.send(audioBuffer);
  } catch (err) {
    logger.warn('Google TTS failed, signalling fallback', { error: err.message });
    return res.status(200).json({
      success:  true,
      fallback: true,
      reason:   err.message,
      text:     text.trim(),
    });
  }
});

// ── Stored audio management ───────────────────────────────────────────────────

const getSentenceAudio = asyncHandler(async (req, res) => {
  const { id, sentenceIndex } = req.params;
  const { voice = 'female', accent = 'american' } = req.query;

  const audio = await passageService.getAudio(id, sentenceIndex, voice, accent);
  if (!audio) {
    return res.status(404).json({
      success:       false,
      noAudio:       true,
      sentenceIndex: parseInt(sentenceIndex, 10),
    });
  }

  res.set({
    'Content-Type':   audio.contentType,
    'Content-Length': audio.data.length,
    'Cache-Control':  'public, max-age=86400',
  });
  res.send(audio.data);
});

const uploadSentenceAudio = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    sentenceIndex,
    audioBase64,
    contentType = 'audio/mpeg',
    voice  = 'female',
    accent = 'american',
  } = req.body;

  let audioBuffer;
  if (req.file) {
    audioBuffer = req.file.buffer;
  } else if (audioBase64) {
    audioBuffer = Buffer.from(audioBase64, 'base64');
  } else {
    throw new AppError('No audio data provided. Send a file or audioBase64 field.', 400);
  }

  if (!audioBuffer.length) throw new AppError('Audio file is empty.', 400);

  const updated = await passageService.saveAudio(
    id, sentenceIndex, voice, accent,
    audioBuffer, req.file?.mimetype || contentType,
  );

  const json = updated.toJSON();
  res.status(200).json({
    success:       true,
    data: {
      message:       'Audio saved successfully',
      sentenceIndex: parseInt(sentenceIndex, 10),
      voice,
      accent,
      audioIndexes:  json.audioIndexes,
      audioCache:    json.audioCache,
    },
  });
});

const deleteSentenceAudio = asyncHandler(async (req, res) => {
  const { id, sentenceIndex } = req.params;
  const { voice, accent }     = req.query;
  const updated = await passageService.deleteAudio(id, sentenceIndex, voice, accent);
  const json    = updated.toJSON();
  res.status(200).json({
    success: true,
    data: {
      message:      'Audio deleted',
      audioIndexes: json.audioIndexes,
      audioCache:   json.audioCache,
    },
  });
});

module.exports = {
  getPassages, getRandomPassage, getPassageById, createPassage,
  generateTTS, getSentenceAudio, uploadSentenceAudio, deleteSentenceAudio,
  ttsStatus,
};
