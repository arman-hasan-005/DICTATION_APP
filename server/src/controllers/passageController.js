const asyncHandler = require("../utils/asyncHandler");
const passageService = require("../services/passageService");
const googleTTS = require("../config/googleTTS");
const AppError = require("../utils/AppError");

// ── Standard passage CRUD ─────────────────────────────────────────────────────

const getPassages = asyncHandler(async (req, res) => {
  res.json(await passageService.getAll({ level: req.query.level }));
});

const getRandomPassage = asyncHandler(async (req, res) => {
  res.json(await passageService.getRandom(req.query.level));
});

const getPassageById = asyncHandler(async (req, res) => {
  res.json(await passageService.getById(req.params.id));
});

const createPassage = asyncHandler(async (req, res) => {
  res.status(201).json(await passageService.create(req.body));
});

// ── Google TTS for uploaded content ──────────────────────────────────────────

/**
 * POST /api/passages/tts
 * Used ONLY for uploaded-content dictation (PDFs, photos, docs).
 * Pre-written passages use their stored audio via GET /passages/:id/audio/:index.
 *
 * Body: { text, voice, accent }
 *   voice  — 'female' | 'male'        (default: 'female')
 *   accent — 'american' | 'british' | 'indian'  (default: 'american')
 *
 * Response: audio/mpeg  OR  { fallback: true } with 200 when TTS is unavailable.
 * The client checks for `fallback: true` and switches to browser speech.
 */
const generateTTS = asyncHandler(async (req, res) => {
  const { text, voice = "female", accent = "american" } = req.body;
  if (!text?.trim()) throw new AppError("Text is required", 400);

  // If Google TTS is not configured, tell the client to use browser fallback
  if (!googleTTS.isConfigured()) {
    return res.status(200).json({
      fallback: true,
      reason: "Google TTS not configured — use browser speech",
      text: text.trim(),
    });
  }

  try {
    const audioBuffer = await googleTTS.generateSpeech(
      text.trim(),
      voice,
      accent,
    );
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length,
      "Cache-Control": "no-store", // uploaded content is ephemeral
      "X-Voice": voice,
      "X-Accent": accent,
    });
    return res.send(audioBuffer);
  } catch (err) {
    // Any Google TTS failure → tell client to fall back to browser voice
    // (do NOT throw — we want a 200 response so the client can handle gracefully)
    console.warn("[TTS] Google TTS failed, signalling fallback:", err.message);
    return res.status(200).json({
      fallback: true,
      reason: err.message,
      text: text.trim(),
    });
  }
});

// ── Stored audio for pre-written passages ─────────────────────────────────────

/**
 * GET /api/passages/:id/audio/:sentenceIndex
 * Stream the stored audio for a specific sentence of a pre-written passage.
 * Returns 404 JSON (not an error throw) when no audio is stored — the client
 * then silently falls back to browser speech.
 */
const getSentenceAudio = asyncHandler(async (req, res) => {
  const { id, sentenceIndex } = req.params;
  const { voice = "female", accent = "american" } = req.query;

  const audio = await passageService.getAudio(id, sentenceIndex, voice, accent);

  if (!audio) {
    return res
      .status(404)
      .json({ noAudio: true, sentenceIndex: parseInt(sentenceIndex, 10) });
  }

  res.set({
    "Content-Type": audio.contentType,
    "Content-Length": audio.data.length,
    "Cache-Control": "public, max-age=86400",
  });
  res.send(audio.data);
});

/**
 * POST /api/passages/:id/audio
 * Upload and store audio for a specific sentence.
 * Body (multipart/form-data): sentenceIndex (number) + audio file
 * OR Body (JSON): { sentenceIndex, audioBase64, contentType }
 */
const uploadSentenceAudio = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    sentenceIndex,
    audioBase64,
    contentType = "audio/mpeg",
    voice = "female",
    accent = "american",
  } = req.body;

  let audioBuffer;

  if (req.file) {
    audioBuffer = req.file.buffer;
  } else if (audioBase64) {
    audioBuffer = Buffer.from(audioBase64, "base64");
  } else {
    throw new AppError(
      "No audio data provided. Send a file or audioBase64 field.",
      400,
    );
  }

  if (!audioBuffer.length) throw new AppError("Audio file is empty.", 400);

  const updated = await passageService.saveAudio(
    id,
    sentenceIndex,
    voice,
    accent,
    audioBuffer,
    req.file?.mimetype || contentType,
  );

  const json = updated.toJSON();
  res.status(200).json({
    message: "Audio saved successfully",
    sentenceIndex: parseInt(sentenceIndex, 10),
    voice,
    accent,
    audioIndexes: json.audioIndexes,
    audioCache: json.audioCache,
  });
});

/**
 * DELETE /api/passages/:id/audio/:sentenceIndex
 * Remove stored audio for a sentence.
 */
const deleteSentenceAudio = asyncHandler(async (req, res) => {
  const { id, sentenceIndex } = req.params;
  const { voice, accent } = req.query;
  const updated = await passageService.deleteAudio(
    id,
    sentenceIndex,
    voice,
    accent,
  );
  const json = updated.toJSON();
  res.json({
    message: "Audio deleted",
    audioIndexes: json.audioIndexes,
    audioCache: json.audioCache,
  });
});

/**
 * GET /api/passages/tts/status
 * Tells the client whether Google TTS is configured.
 * Used by the DictationSettings panel to show the correct voice info.
 */
const ttsStatus = asyncHandler(async (req, res) => {
  res.json({
    googleTTS: googleTTS.isConfigured(),
    voices: googleTTS.isConfigured() ? googleTTS.VOICE_NAMES : null,
  });
});

module.exports = {
  getPassages,
  getRandomPassage,
  getPassageById,
  createPassage,
  generateTTS,
  getSentenceAudio,
  uploadSentenceAudio,
  deleteSentenceAudio,
  ttsStatus,
};
