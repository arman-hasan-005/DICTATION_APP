const router = require('express').Router();
const { getLeaderboard } = require('../controllers/leaderboardController');
const { protect } = require('../middlewares/authMiddleware');
router.get('/', protect, getLeaderboard);
module.exports = router;
