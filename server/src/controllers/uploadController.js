const asyncHandler = require('../utils/asyncHandler');
const uploadService = require('../services/uploadService');
const AppError      = require('../utils/AppError');

/**
 * POST /api/upload/extract
 * Accepts a single file upload and returns extracted text.
 * For images, returns base64 data so the client can run Tesseract.js OCR.
 */
const extractText = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded. Please attach a file.', 400);
  const result = await uploadService.extractText(req.file);
  res.json({ success: true, ...result });
});

module.exports = { extractText };
