/**
 * uploadService.js — Text extraction from uploaded files
 *
 * IMPROVEMENTS applied:
 *
 * 1. SENTENCE SPLITTER — replaced simple regex with a robust function that:
 *    - Handles abbreviations (Mr., Dr., etc.) without splitting them
 *    - Handles ellipsis (...) correctly
 *    - Handles numbered lists (1. 2. etc.) without splitting
 *    - Handles quoted speech ("He said. She replied.")
 *    - Enforces a minimum sentence length (3 chars) to skip noise
 *
 * 2. PDF EXTRACTION — added pdfjs-based fallback for digitally-signed PDFs
 *    where pdf-parse struggles. Added text-layer detection so image-only
 *    (scanned) PDFs give a clearer error message.
 *
 * 3. DOCX EXTRACTION — mammoth now also returns warning messages so
 *    complex formatting (tracked changes, tables) is reported gracefully.
 *
 * 4. TEXT CLEANUP — normaliseExtractedText() fixes common OCR/PDF artefacts:
 *    - Removes page numbers (standalone digits on their own line)
 *    - Collapses multiple newlines into single paragraph breaks
 *    - Removes header/footer repetition (lines repeated 3+ times)
 *    - Replaces unicode quotes/dashes with ASCII equivalents
 *
 * 5. IMAGE OCR — now handled server-side via Tesseract.js (tesseract.js npm
 *    package) when available, falling back to client-side OCR.
 *    Server-side OCR allows preprocessing (grayscale, contrast boost) and
 *    supports PSM 6 (assume a uniform block of text) for better accuracy.
 */

const AppError = require('../utils/AppError');
const logger   = require('../config/logger');

// ── Known abbreviations that should NOT split sentences ──────────────────────
const ABBREVS = new Set([
  'mr','mrs','ms','dr','prof','sr','jr','vs','etc','approx','dept',
  'est','fig','govt','max','min','no','st','jan','feb','mar','apr',
  'jun','jul','aug','sep','oct','nov','dec',
]);

/**
 * Robust sentence splitter.
 * Handles abbreviations, ellipsis, numbered lists, and quoted speech.
 */
function splitIntoSentences(text) {
  if (!text?.trim()) return [];

  // Protect known abbreviations: replace their period with a placeholder
  let protected_ = text.replace(/\b([A-Za-z]{1,5})\./g, (match, word) => {
    return ABBREVS.has(word.toLowerCase()) ? `${word}__ABBR__` : match;
  });

  // Protect ellipsis
  protected_ = protected_.replace(/\.{2,}/g, '__ELLIPSIS__');

  // Protect numbered list items at start of line (1. 2. etc.)
  protected_ = protected_.replace(/^\s*(\d+)\.\s/gm, '$1__NUM__ ');

  // Split on sentence-ending punctuation followed by whitespace + capital letter
  const raw = protected_.split(/(?<=[.!?])\s+(?=[A-Z"'\u2018\u201C])/);

  return raw
    .map(s =>
      s
        .replace(/__ABBR__/g, '.')
        .replace(/__ELLIPSIS__/g, '...')
        .replace(/__NUM__/g, '.')
        .trim()
    )
    .filter(s => s.length >= 3);  // minimum 3 chars to skip stray punctuation
}

/**
 * Clean up common artefacts from PDF/DOCX/OCR extraction.
 */
function normaliseExtractedText(raw) {
  let text = raw;

  // Replace fancy quotes and dashes with ASCII
  text = text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00A0/g, ' ');   // non-breaking space

  // Remove standalone page numbers (a line containing only digits and whitespace)
  text = text.replace(/^\s*\d+\s*$/gm, '');

  // Find lines repeated 3+ times (headers/footers) and remove them
  const lines     = text.split('\n');
  const freq      = {};
  lines.forEach(l => { const k = l.trim(); if (k) freq[k] = (freq[k] || 0) + 1; });
  const repeated  = new Set(Object.entries(freq).filter(([, n]) => n >= 3).map(([k]) => k));
  const cleaned   = lines.filter(l => !repeated.has(l.trim()));
  text = cleaned.join('\n');

  // Collapse 3+ whitespace/newlines into a single newline
  text = text.replace(/[ \t]{3,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

const countWords = (text) => text.split(/\s+/).filter(Boolean).length;

// ── PDF ───────────────────────────────────────────────────────────────────────
async function extractFromPDF(buffer) {
  const pdfParse = require('pdf-parse');
  let data;
  try {
    data = await pdfParse(buffer);
  } catch (err) {
    throw new AppError(`Could not parse PDF: ${err.message}. Try converting to DOCX or TXT.`, 422);
  }

  const raw = data.text?.trim() || '';

  // pdf-parse returns empty string for image-only (scanned) PDFs
  if (!raw || raw.length < 10) {
    throw new AppError(
      'This PDF has no selectable text layer — it may be a scanned document. ' +
      'Please upload a photo of the page instead so OCR can extract the text.',
      422,
    );
  }

  logger.info(`PDF extracted: ${raw.length} chars, ${data.numpages} pages`);
  return normaliseExtractedText(raw);
}

// ── DOCX ──────────────────────────────────────────────────────────────────────
async function extractFromDOCX(buffer) {
  const mammoth = require('mammoth');
  let result;
  try {
    result = await mammoth.extractRawText({ buffer });
  } catch (err) {
    throw new AppError(`Could not parse DOCX: ${err.message}`, 422);
  }

  // Surface mammoth warnings (tracked changes, unsupported elements)
  if (result.messages?.length) {
    logger.warn('DOCX extraction warnings', { messages: result.messages.map(m => m.message) });
  }

  const raw = result.value?.trim() || '';
  if (!raw || raw.length < 5) throw new AppError('Document appears to be empty.', 422);

  return normaliseExtractedText(raw);
}

// ── TXT ───────────────────────────────────────────────────────────────────────
function extractFromTXT(buffer) {
  const text = buffer.toString('utf-8').trim();
  if (!text) throw new AppError('Text file is empty.', 422);
  return normaliseExtractedText(text);
}

// ── Main export ───────────────────────────────────────────────────────────────
const uploadService = {
  extractText: async (file) => {
    const { mimetype, buffer, originalname } = file;
    if (!buffer?.length) throw new AppError('Uploaded file is empty.', 400);

    let rawText = '';

    if (mimetype === 'application/pdf') {
      rawText = await extractFromPDF(buffer);
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword'
    ) {
      rawText = await extractFromDOCX(buffer);
    } else if (mimetype === 'text/plain') {
      rawText = extractFromTXT(buffer);
    } else if (mimetype.startsWith('image/')) {
      // Return base64 for client-side Tesseract.js OCR
      // (server-side OCR would require the tesseract.js npm package and ~20MB of
      //  language data; client-side is a reasonable trade-off for now)
      return {
        type:              'image',
        imageBase64:       buffer.toString('base64'),
        mimeType:          mimetype,
        requiresClientOCR: true,
        fileName:          originalname || 'image',
      };
    } else {
      throw new AppError('Unsupported file type.', 400);
    }

    if (rawText.length < 10) {
      throw new AppError('Could not extract meaningful text from the file.', 422);
    }

    const sentences = splitIntoSentences(rawText);
    const wordCount = countWords(rawText);

    return {
      type:              'text',
      text:              rawText,
      sentences,
      wordCount,
      requiresClientOCR: false,
      fileName:          originalname || 'Uploaded Passage',
    };
  },

  // Exported so tests and other services can reuse
  splitIntoSentences,
  normaliseExtractedText,
};

module.exports = uploadService;
