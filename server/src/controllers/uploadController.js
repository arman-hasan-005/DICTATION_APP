/**
 * uploadController.js
 *
 * extractText     — existing endpoint: PDF/DOCX/TXT + images → base64 (unchanged)
 * ocrHandwriting  — hybrid server OCR for HandwriteMode images
 *
 * POST /api/upload/ocr-handwriting
 * ─────────────────────────────────
 * Accepts: multipart/form-data, field "file" (one image per call)
 *
 * Success response shape:
 * {
 *   success: true,
 *   data: {
 *     text:         string,   — extracted handwritten text
 *     confidence:   number,   — 0-100
 *     source:       string,   — 'vision+tesseract' | 'google_vision' | 'tesseract'
 *     fallbackUsed: boolean,  — true if one server engine was skipped or failed
 *   }
 * }
 *
 * Client-fallback response (when all server engines fail):
 * {
 *   success: true,
 *   data: {
 *     requiresClientOCR: true,
 *     fallbackUsed:      true,
 *     imageBase64:       string,  — raw image for client Tesseract
 *     mimeType:          string,
 *   }
 * }
 */

const asyncHandler  = require('../utils/asyncHandler');
const uploadService = require('../services/uploadService');
const ocrService    = require('../services/ocrService');
const AppError      = require('../utils/AppError');
const logger        = require('../config/logger');

// ── Existing: extract text from any file ─────────────────────────────────────
const extractText = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded. Please attach a file.', 400);
  const result = await uploadService.extractText(req.file);
  res.status(200).json({ success: true, data: result });
});

// ── Hybrid OCR for handwriting ────────────────────────────────────────────────
const ocrHandwriting = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No image uploaded.', 400);

  const { buffer, mimetype, originalname } = req.file;

  if (!mimetype.startsWith('image/')) {
    throw new AppError('Only image files are accepted for handwriting OCR.', 400);
  }

  logger.info('Handwriting OCR request received', {
    name:     originalname,
    mimeType: mimetype,
    sizeKb:   Math.round(buffer.length / 1024),
  });

  const result = await ocrService.recogniseHandwriting(buffer, mimetype);

  if (result.requiresClientOCR) {
    // All server engines failed — send image back so client can run Tesseract
    logger.warn('All server OCR engines failed — returning image for client fallback');
    return res.status(200).json({
      success: true,
      data: {
        requiresClientOCR: true,
        fallbackUsed:      true,
        imageBase64:       buffer.toString('base64'),
        mimeType:          mimetype,
      },
    });
  }

  res.status(200).json({ success: true, data: result });
});

// ── Vision API connectivity test ──────────────────────────────────────────────
/**
 * GET /api/upload/vision-test
 * Hits the Vision API with a 1x1 pixel image to verify key + API enabled.
 * Returns { ok, status, message, hint? } — never throws.
 */
const testVision = asyncHandler(async (req, res) => {
  const googleVision = require('../config/googleVision');
  const result = await googleVision.testConnection();
  res.status(200).json({ success: true, data: result });
});

module.exports = { extractText, ocrHandwriting, testVision };
