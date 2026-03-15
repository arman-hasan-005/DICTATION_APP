const router = require('express').Router();
router.use('/auth',        require('./authRoutes'));
router.use('/sessions',    require('./sessionRoutes'));
router.use('/passages',    require('./passageRoutes'));
router.use('/leaderboard', require('./leaderboardRoutes'));
router.use('/upload',      require('./uploadRoutes'));
module.exports = router;
