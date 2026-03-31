const router = require('express').Router();
const { saveSession, getSessions, getStats, getSessionById } =
  require('../controllers/sessionController');
const { protect }                      = require('../middlewares/authMiddleware');
const { validate, sessionRules }       = require('../middlewares/validate');

// Note: /stats must come before /:id or Express will treat "stats" as an id
router.post('/',        protect, sessionRules, validate, saveSession);
router.get('/',         protect, getSessions);
router.get('/stats',    protect, getStats);
router.get('/:id',      protect, getSessionById);

module.exports = router;
