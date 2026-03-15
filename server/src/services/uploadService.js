const AppError = require('../utils/AppError');

/* ─── PDF ──────────────────────────────────────────────────────────────────── */
const extractFromPDF = async (buffer) => {
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);
  const text = data.text.replace(/\s{3,}/g, '\n').trim();
  if (!text) throw new AppError('PDF appears to be empty or image-only (scanned PDF). Try uploading an image instead.', 422);
  return text;
};

/* ─── DOCX ──────────────────────────────────────────────────────────────────── */
const extractFromDOCX = async (buffer) => {
  const mammoth = require('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value.replace(/\s{3,}/g, '\n').trim();
  if (!text) throw new AppError('Document appears to be empty.', 422);
  return text;
};

/* ─── TXT ───────────────────────────────────────────────────────────────────── */
const extractFromTXT = (buffer) => {
  const text = buffer.toString('utf-8').trim();
  if (!text) throw new AppError('Text file is empty.', 422);
  return text;
};

/* ─── Split text into clean sentences ───────────────────────────────────────── */
const splitIntoSentences = (text) =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

/* ─── Count words ────────────────────────────────────────────────────────────── */
const countWords = (text) => text.split(/\s+/).filter(Boolean).length;

/* ─── Main extraction entry ──────────────────────────────────────────────────── */
const uploadService = {
  extractText: async (file) => {
    const { mimetype, buffer, originalname } = file;

    if (!buffer || !buffer.length) throw new AppError('Uploaded file is empty.', 400);

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
      // Images are returned as base64 for client-side Tesseract.js OCR
      return {
        type: 'image',
        imageBase64: buffer.toString('base64'),
        mimeType: mimetype,
        requiresClientOCR: true,
        fileName: originalname || 'image',
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
      type: 'text',
      text: rawText,
      sentences,
      wordCount,
      requiresClientOCR: false,
      fileName: originalname || 'Uploaded Passage',
    };
  },
};

module.exports = uploadService;
