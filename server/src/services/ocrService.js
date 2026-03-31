/**
 * ocrService.js — Hybrid handwriting OCR
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  PIPELINE
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 *  Both engines run concurrently (Promise.allSettled):
 *
 *   ┌─────────────────────────┐   ┌──────────────────────────┐
 *   │     Google Vision       │   │   Server Tesseract.js    │
 *   │  DOCUMENT_TEXT_DETECT.  │   │  PSM 6  ·  OEM 1 (LSTM) │
 *   │  90-98% on handwriting  │   │  60-80% on handwriting   │
 *   └────────────┬────────────┘   └─────────────┬────────────┘
 *                │ words[] + wordConfidences[]   │ words[]
 *                └───────────────┬───────────────┘
 *                         ┌──────▼──────┐
 *                         │   MERGER    │
 *                         │  per-word   │
 *                         │   voting    │
 *                         └──────┬──────┘
 *                                │ { text, confidence, source }
 *                             response
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  MERGER LOGIC  (per-word voting)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 *  For each word position i:
 *
 *  Case A — only one engine produced word i  → use it.
 *
 *  Case B — both agree (normalised)          → use Vision word
 *             (better casing / punctuation)
 *
 *  Case C — both differ, Vision per-word confidence ≥ 0.60
 *             → Vision wins  (higher baseline accuracy)
 *
 *  Case D — both differ, Vision per-word confidence < 0.60
 *            AND Levenshtein(vision_i, tess_i) ≤ 1
 *             → Tesseract wins  (Vision uncertain, Tesseract close)
 *
 *  Case E — both differ, Vision per-word confidence < 0.60
 *            AND Levenshtein > 1  (engines strongly disagree)
 *             → use Vision  (uncertain but still higher baseline)
 *
 *  Any extra words from the longer list are appended as-is.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  FALLBACK CHAIN
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *   1. Vision + Tesseract merged      (best)
 *   2. Vision only                    (Vision configured, Tess fails)
 *   3. Tesseract only                 (Vision not configured / fails)
 *   4. { requiresClientOCR: true }    (all server engines fail → client Tesseract)
 */

const logger       = require('../config/logger');
const googleVision = require('../config/googleVision');

// ─────────────────────────────────────────────────────────────────────────────
//  Server-side Tesseract.js
// ─────────────────────────────────────────────────────────────────────────────

async function runServerTesseract(imageBuffer) {
  let Tesseract;
  try {
    Tesseract = require('tesseract.js');
  } catch {
    throw new Error('tesseract.js not installed — run: cd server && npm install');
  }

  // createWorker(langs, oem, options)
  // oem=1 → LSTM only (most accurate)
  const worker = await Tesseract.createWorker('eng', 1, {
    logger: () => {},   // silence verbose per-character output
  });

  try {
    // PSM 6: Assume a single uniform block of text — correct for notebook pages
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
    });

    const { data } = await worker.recognize(imageBuffer);
    const text  = data.text?.trim() ?? '';
    const words = (data.words ?? []).map(w => w.text).filter(Boolean);

    return {
      text,
      confidence: Math.round(data.confidence ?? 0),
      words,
      source: 'tesseract',
    };
  } finally {
    await worker.terminate();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Normalise a word for comparison: lowercase, strip non-alphanumeric */
const norm = (s) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Levenshtein distance, capped at 3 for speed.
 * Returns 3 immediately if lengths differ by more than 2.
 */
function editDist(a, b) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 3;
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

// ─────────────────────────────────────────────────────────────────────────────
//  Word-level merger
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merge Vision and Tesseract results using per-word voting.
 *
 * @param {{
 *   text: string, words: string[], wordConfidences: (number|null)[], confidence: number
 * } | null} vision
 * @param {{
 *   text: string, words: string[], confidence: number
 * } | null} tess
 * @returns {string}  merged text
 */
function mergeResults(vision, tess) {
  if (!vision && !tess) return '';
  if (!vision)          return tess.text;
  if (!tess)            return vision.text;

  const vWords = vision.words;
  const tWords = tess.words;
  const vConfs = vision.wordConfidences ?? [];  // per-word 0.0-1.0 or null
  const len    = Math.max(vWords.length, tWords.length);
  const merged = [];

  for (let i = 0; i < len; i++) {
    const vw = vWords[i];
    const tw = tWords[i];

    // Case A — only one engine has this position
    if (!vw && !tw) continue;
    if (!vw) { merged.push(tw); continue; }
    if (!tw) { merged.push(vw); continue; }

    const vNorm = norm(vw);
    const tNorm = norm(tw);

    if (vNorm === tNorm) {
      // Case B — agreement: use Vision (better casing/punctuation)
      merged.push(vw);
      continue;
    }

    // Per-word Vision confidence for position i
    // Fall back to the overall confidence (scaled 0-1) if per-word is absent
    const perWordConf = vConfs[i] !== null && vConfs[i] !== undefined
      ? vConfs[i]
      : vision.confidence / 100;

    if (perWordConf >= 0.60) {
      // Case C — Vision is reasonably confident → trust it
      merged.push(vw);
    } else if (editDist(vNorm, tNorm) <= 1) {
      // Case D — Vision uncertain, Tesseract is very close → Tesseract wins
      merged.push(tw);
    } else {
      // Case E — Vision uncertain, large disagreement → still use Vision
      merged.push(vw);
    }
  }

  return merged.join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Perform hybrid OCR on a single handwriting image buffer.
 *
 * @param {Buffer} imageBuffer
 * @param {string} mimeType
 * @returns {{
 *   text:              string,
 *   confidence:        number,   // 0-100
 *   source:            string,   // 'vision+tesseract' | 'google_vision' | 'tesseract'
 *   fallbackUsed:      boolean,
 *   requiresClientOCR: boolean,  // true → all server engines failed, client must handle
 * }}
 */
async function recogniseHandwriting(imageBuffer, mimeType) {
  let visionResult = null;
  let tessResult   = null;
  let visionFailed = false;
  let tessFailed   = false;

  // Run both engines concurrently — one failure doesn't block the other
  const [visionOutcome, tessOutcome] = await Promise.allSettled([
    googleVision.isConfigured()
      ? googleVision.extractTextFromImage(imageBuffer, mimeType)
      : Promise.reject(new Error('Google Vision not configured')),
    runServerTesseract(imageBuffer),
  ]);

  if (visionOutcome.status === 'fulfilled') {
    visionResult = visionOutcome.value;
    logger.info('Vision OCR succeeded', {
      chars: visionResult.text.length,
      words: visionResult.words.length,
      confidence: visionResult.confidence,
    });
  } else {
    visionFailed = true;
    logger.warn('Vision OCR failed — Tesseract will be used solo', {
      reason: visionOutcome.reason?.message ?? 'unknown',
    });
  }

  if (tessOutcome.status === 'fulfilled') {
    tessResult = tessOutcome.value;
    logger.info('Tesseract OCR succeeded', {
      chars: tessResult.text.length,
      words: tessResult.words.length,
      confidence: tessResult.confidence,
    });
  } else {
    tessFailed = true;
    logger.warn('Tesseract OCR failed', {
      reason: tessOutcome.reason?.message ?? 'unknown',
    });
  }

  // Both failed → signal client to fall back to browser Tesseract
  if (!visionResult && !tessResult) {
    logger.error('All server OCR engines failed — requesting client-side fallback');
    return { requiresClientOCR: true, fallbackUsed: true };
  }

  // Determine final output
  let finalText;
  let source;
  let confidence;

  if (visionResult && tessResult) {
    // Both succeeded — merge word-by-word
    finalText  = mergeResults(visionResult, tessResult);
    source     = 'vision+tesseract';
    // Weighted confidence: Vision 60%, Tesseract 40%
    confidence = Math.round(visionResult.confidence * 0.60 + tessResult.confidence * 0.40);
  } else if (visionResult) {
    finalText  = visionResult.text;
    source     = 'google_vision';
    confidence = visionResult.confidence;
  } else {
    finalText  = tessResult.text;
    source     = 'tesseract';
    confidence = tessResult.confidence;
  }

  // Normalise whitespace that merging may have introduced
  finalText = finalText.replace(/\s+/g, ' ').trim();

  logger.info('Hybrid OCR complete', { source, confidence, chars: finalText.length });

  return {
    text:              finalText,
    confidence,
    source,
    fallbackUsed:      visionFailed || tessFailed,
    requiresClientOCR: false,
  };
}

module.exports = { recogniseHandwriting };
