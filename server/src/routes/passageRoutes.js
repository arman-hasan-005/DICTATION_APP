const router = require('express').Router();
const {
  getPassages, getRandomPassage, getPassageById, createPassage,
  generateTTS,
  getSentenceAudio, uploadSentenceAudio, deleteSentenceAudio,
  ttsStatus,
} = require('../controllers/passageController');
const { protect } = require('../middlewares/authMiddleware');
const upload      = require('../config/multer');

// ── TTS status (no auth — client checks this on load) ─────────────────────────
router.get('/tts/status', ttsStatus);

// ── Google TTS for uploaded content ──────────────────────────────────────────
router.post('/tts', protect, generateTTS);

// ── Standard passage routes (must come before /:id) ───────────────────────────
router.get('/random', protect, getRandomPassage);
router.get('/',       protect, getPassages);
router.post('/',      protect, createPassage);

// ── Per-passage audio management ─────────────────────────────────────────────
// GET    /api/passages/:id/audio/:sentenceIndex  → stream stored audio
// POST   /api/passages/:id/audio                → upload audio for a sentence
// DELETE /api/passages/:id/audio/:sentenceIndex  → delete stored audio
router.get   ('/:id/audio/:sentenceIndex', protect, getSentenceAudio);
router.post  ('/:id/audio',               protect, upload.single('audioFile'), uploadSentenceAudio);
router.delete('/:id/audio/:sentenceIndex', protect, deleteSentenceAudio);

// ── Individual passage ─────────────────────────────────────────────────────────
router.get('/:id', protect, getPassageById);

module.exports = router;
