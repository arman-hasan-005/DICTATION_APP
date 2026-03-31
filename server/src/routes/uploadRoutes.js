const router = require('express').Router();
const { extractText, ocrHandwriting, testVision } = require('../controllers/uploadController');
const { protect } = require('../middlewares/authMiddleware');
const upload      = require('../config/multer');

// Existing: extract text from any file type
router.post('/extract',         protect, upload.single('file'), extractText);

// New: hybrid OCR for handwriting-mode images
router.post('/ocr-handwriting', protect, upload.single('file'), ocrHandwriting);

// Diagnostic: test Vision API key + enablement
router.get('/vision-test', protect, testVision);

module.exports = router;
