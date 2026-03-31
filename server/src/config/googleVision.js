/**
 * googleVision.js — Google Cloud Vision API client (pure REST, no SDK)
 *
 * Feature: DOCUMENT_TEXT_DETECTION
 *   Better than TEXT_DETECTION for handwriting — denser model, understands
 *   line structure, handles mixed print+cursive, returns per-word confidence.
 *
 * Exports:
 *   isConfigured()          → boolean
 *   extractTextFromImage()  → { text, confidence, words[], wordConfidences[] }
 *   testConnection()        → { ok, status, message } — for /api/upload/vision-test
 */

const { googleVisionKey } = require('./env');
const logger   = require('./logger');
const AppError = require('../utils/AppError');

const VISION_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';
const TIMEOUT_MS      = 20_000;

const isConfigured = () => Boolean(googleVisionKey);

/**
 * Perform a minimal Vision API call with a 1×1 white pixel to verify:
 *   - The API key is valid
 *   - Cloud Vision API is enabled on the GCP project
 *   - Billing is active
 *
 * Returns { ok: bool, status: number, message: string }
 * Never throws — always returns a result object.
 */
const testConnection = async () => {
  if (!googleVisionKey) {
    return { ok: false, status: 0, message: 'GOOGLE_VISION_KEY is not set in .env' };
  }

  // Minimal valid JPEG: 1×1 white pixel (avoids sending a real image)
  const TINY_JPEG_B64 =
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U' +
    'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN' +
    'DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy' +
    'MjL/wAARCAABAAEDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAFBABAA' +
    'AAAAAAAAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAA' +
    'AAAAAAAA/9oADAMBAAIRAxEAPwCwABmX/9k=';

  try {
    const body = JSON.stringify({
      requests: [{
        image:    { content: TINY_JPEG_B64 },
        features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
      }],
    });

    const response = await fetch(`${VISION_ENDPOINT}?key=${googleVisionKey}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal:  AbortSignal.timeout(10_000),
    });

    const json = await response.json();

    if (!response.ok) {
      const errMsg = json?.error?.message ?? `HTTP ${response.status}`;
      logger.warn('Vision API test failed', { status: response.status, message: errMsg });
      return {
        ok:      false,
        status:  response.status,
        message: errMsg,
        hint:    diagnoseVisionError(response.status, errMsg),
      };
    }

    // HTTP 200 but per-request error (e.g. image format issue — not auth)
    const apiErr = json?.responses?.[0]?.error;
    if (apiErr && apiErr.code !== 3) { // code 3 = INVALID_ARGUMENT (blank image is fine here)
      return {
        ok:      false,
        status:  apiErr.code,
        message: apiErr.message,
        hint:    diagnoseVisionError(apiErr.code, apiErr.message),
      };
    }

    logger.info('Vision API test passed');
    return { ok: true, status: 200, message: 'Cloud Vision API is reachable and responding.' };

  } catch (err) {
    return {
      ok:      false,
      status:  0,
      message: err.message,
      hint:    'Network error — check that the server can reach external HTTPS endpoints.',
    };
  }
};

/**
 * Map common Vision API HTTP status codes to actionable hints.
 */
function diagnoseVisionError(status, message = '') {
  const msg = message.toLowerCase();
  if (status === 400) {
    if (msg.includes('api key not valid') || msg.includes('api_key_invalid')) {
      return 'The API key in GOOGLE_VISION_KEY is invalid. Regenerate it in Google Cloud Console → Credentials.';
    }
    return 'Bad request — check that the Cloud Vision API is enabled on your GCP project.';
  }
  if (status === 403) {
    if (msg.includes('disabled'))
      return 'Cloud Vision API is not enabled. Go to: console.cloud.google.com → APIs & Services → Enable APIs → search "Cloud Vision API" → Enable.';
    if (msg.includes('billing'))
      return 'Billing is not enabled on the GCP project. Go to: console.cloud.google.com → Billing → Link a billing account.';
    if (msg.includes('permission') || msg.includes('forbidden'))
      return 'The API key does not have permission to use Cloud Vision. Check key restrictions in Credentials — make sure "Cloud Vision API" is in the allowed APIs list (or set to "unrestricted").';
    return 'Access denied (403). Cloud Vision API may not be enabled, or billing is not set up.';
  }
  if (status === 429)
    return 'Quota exceeded. Check your Cloud Vision API quota in Google Cloud Console → APIs & Services → Cloud Vision API → Quotas.';
  if (status === 0)
    return 'Could not reach Google servers. Check server internet connectivity and firewall rules.';
  return `Unexpected error (HTTP ${status}). Check the GCP project logs for details.`;
}

/**
 * Extract text from an image buffer using Cloud Vision DOCUMENT_TEXT_DETECTION.
 */
const extractTextFromImage = async (imageBuffer, mimeType = 'image/jpeg') => {
  if (!googleVisionKey) {
    throw new AppError('GOOGLE_VISION_KEY not configured', 503);
  }

  const body = JSON.stringify({
    requests: [{
      image:    { content: imageBuffer.toString('base64') },
      features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
      imageContext: { languageHints: ['en'] },
    }],
  });

  let response;
  try {
    response = await fetch(`${VISION_ENDPOINT}?key=${googleVisionKey}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal:  AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const msg = err.name === 'TimeoutError'
      ? 'Google Vision timed out'
      : `Google Vision unreachable: ${err.message}`;
    throw new AppError(msg, 502);
  }

  if (!response.ok) {
    let detail = `Google Vision HTTP ${response.status}`;
    let hint   = '';
    try {
      const errBody = await response.json();
      if (errBody?.error?.message) {
        detail = `Google Vision: ${errBody.error.message}`;
        hint   = diagnoseVisionError(response.status, errBody.error.message);
      }
    } catch { /* ignore */ }

    // Log the full detail server-side so the developer can diagnose
    logger.error('Vision API request failed', {
      status: response.status,
      detail,
      hint,
    });

    throw new AppError(detail, response.status === 429 ? 429 : 502);
  }

  const json   = await response.json();
  const apiErr = json?.responses?.[0]?.error;
  if (apiErr) {
    logger.error('Vision API per-request error', { code: apiErr.code, message: apiErr.message });
    throw new AppError(`Google Vision API: ${apiErr.message}`, 502);
  }

  const annotation = json?.responses?.[0]?.fullTextAnnotation;
  const fullText   = annotation?.text?.trim() ?? '';
  if (!fullText) throw new AppError('Google Vision: no text detected', 422);

  // Extract per-word data
  const words           = [];
  const wordConfidences = [];

  for (const page of annotation?.pages ?? []) {
    for (const block of page?.blocks ?? []) {
      for (const para of block?.paragraphs ?? []) {
        for (const word of para?.words ?? []) {
          const str = (word.symbols ?? []).map(s => s.text).join('');
          if (!str) continue;
          words.push(str);
          wordConfidences.push(
            typeof word.confidence === 'number' ? word.confidence : null
          );
        }
      }
    }
  }

  const defined = wordConfidences.filter(c => c !== null);
  const avgConf = defined.length
    ? Math.round((defined.reduce((a, b) => a + b, 0) / defined.length) * 100)
    : 85;

  logger.info('Google Vision OCR success', {
    words: words.length, chars: fullText.length, confidence: avgConf,
  });

  return {
    text: fullText, confidence: avgConf,
    words, wordConfidences,
    source: 'google_vision',
  };
};

module.exports = { isConfigured, extractTextFromImage, testConnection };
