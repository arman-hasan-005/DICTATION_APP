const router    = require('express').Router();
const { extractText } = require('../controllers/uploadController');
const { protect }     = require('../middlewares/authMiddleware');
const upload          = require('../config/multer');

// POST /api/upload/extract — multipart/form-data, field name: "file"
router.post('/extract', protect, upload.single('file'), extractText);

module.exports = router;
