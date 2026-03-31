/**
 * uploadController.js — Consistent { success, data } responses
 */
const asyncHandler  = require('../utils/asyncHandler');
const uploadService = require('../services/uploadService');
const AppError      = require('../utils/AppError');

const extractText = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded. Please attach a file.', 400);
  const result = await uploadService.extractText(req.file);
  res.status(200).json({ success: true, data: result });
});

module.exports = { extractText };
