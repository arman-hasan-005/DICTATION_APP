/**
 * googleTTS.js — Google Cloud Text-to-Speech via REST API
 *
 * No SDK needed — uses the standard fetch() built into Node 18+.
 * API key is read from GOOGLE_TTS_KEY env variable.
 *
 * Voice mapping (gender × language):
 *   female + american → en-US  FEMALE
 *   female + british  → en-GB  FEMALE
 *   female + indian   → en-IN  FEMALE
 *   male   + american → en-US  MALE
 *   male   + british  → en-GB  MALE
 *   male   + indian   → en-IN  MALE
 *
 * Returns MP3 audio as a Buffer.
 * Throws a structured AppError so the controller can decide whether to
 * return 502 or signal the client to fall back to browser speech.
 */

const { googleTTSKey } = require('./env');
const AppError = require('../utils/AppError');

const GOOGLE_TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// Language code map keyed by accent
const LANG_CODES = {
  american: 'en-US',
  british:  'en-GB',
  indian:   'en-IN',
};

// Google voice names that produce the best quality for each combination.
// Using WaveNet voices where available (higher quality, same free-tier quota).
const VOICE_NAMES = {
  female: {
    american: 'en-US-Wavenet-F',
    british:  'en-GB-Wavenet-A',
    indian:   'en-IN-Wavenet-A',
  },
  male: {
    american: 'en-US-Wavenet-D',
    british:  'en-GB-Wavenet-B',
    indian:   'en-IN-Wavenet-B',
  },
};

/**
 * Generate speech using Google Cloud TTS REST API.
 *
 * @param {string} text    - Text to synthesise (max ~5000 bytes)
 * @param {string} gender  - 'female' | 'male'
 * @param {string} accent  - 'american' | 'british' | 'indian'
 * @returns {Promise<Buffer>} MP3 audio buffer
 */
const generateSpeech = async (text, gender = 'female', accent = 'american') => {
  if (!googleTTSKey) {
    throw new AppError('GOOGLE_TTS_KEY not configured — use browser voice fallback', 503);
  }

  if (!text?.trim()) {
    throw new AppError('Text is required for TTS', 400);
  }

  const safeGender = VOICE_NAMES[gender]    ? gender : 'female';
  const safeAccent = LANG_CODES[accent]     ? accent : 'american';

  const languageCode = LANG_CODES[safeAccent];
  const voiceName    = VOICE_NAMES[safeGender][safeAccent];

  const body = {
    input: { text: text.trim() },
    voice: {
      languageCode,
      name:       voiceName,
      ssmlGender: safeGender === 'female' ? 'FEMALE' : 'MALE',
    },
    audioConfig: {
      audioEncoding:   'MP3',
      speakingRate:    1.0,  // speed controlled client-side via Audio.playbackRate
      pitch:           0.0,
      volumeGainDb:    0.0,
    },
  };

  let response;
  try {
    response = await fetch(`${GOOGLE_TTS_ENDPOINT}?key=${googleTTSKey}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(15_000),
    });
  } catch (err) {
    const msg = err.name === 'TimeoutError'
      ? 'Google TTS request timed out'
      : `Google TTS unreachable: ${err.message}`;
    throw new AppError(msg, 502);
  }

  if (!response.ok) {
    let detail = `Google TTS error: HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      if (errBody?.error?.message) detail = `Google TTS: ${errBody.error.message}`;
    } catch {/* ignore */}
    throw new AppError(detail, response.status === 400 ? 400 : 502);
  }

  const json = await response.json();
  if (!json.audioContent) {
    throw new AppError('Google TTS returned empty audio content', 502);
  }

  // audioContent is base64-encoded MP3
  return Buffer.from(json.audioContent, 'base64');
};

/**
 * True if the Google TTS key is configured.
 */
const isConfigured = () => !!googleTTSKey;

module.exports = { generateSpeech, isConfigured, LANG_CODES, VOICE_NAMES };
