const { validationResult, body } = require('express-validator');
const AppError = require('../utils/AppError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);
  next();
};

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }).withMessage('Name too long'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const sessionRules = [
  body('passageTitle').trim().notEmpty().withMessage('Passage title is required'),
  body('score').isFloat({ min: 0, max: 100 }).withMessage('Score must be 0–100'),
  body('totalWords').isInt({ min: 0 }).withMessage('totalWords must be a positive number'),
];

const otpRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits'),
];

const forgotPasswordRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
];

const resetPasswordRules = [
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

module.exports = {
  validate,
  registerRules, loginRules, sessionRules,
  otpRules, forgotPasswordRules, resetPasswordRules,
};
