const router = require('express').Router();
const {
  register, login, getMe, getProfile, updateProfile, changePassword,
} = require('../controllers/authController');
const { protect }                               = require('../middlewares/authMiddleware');
const { validate, registerRules, loginRules }   = require('../middlewares/validate');

router.post('/register',  registerRules, validate, register);
router.post('/login',     loginRules,    validate, login);
router.get('/me',         protect, getMe);
router.get('/profile',    protect, getProfile);
router.put('/profile',    protect, updateProfile);
router.put('/password',   protect, changePassword);

module.exports = router;
