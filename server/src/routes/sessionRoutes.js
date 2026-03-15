const router = require('express').Router();
const { saveSession, getSessions, getSessionById } = require('../controllers/sessionController');
const { protect } = require('../middlewares/authMiddleware');
const { validate, sessionRules } = require('../middlewares/validate');
router.post('/',   protect, sessionRules, validate, saveSession);
router.get('/',    protect, getSessions);
router.get('/:id', protect, getSessionById);
module.exports = router;
