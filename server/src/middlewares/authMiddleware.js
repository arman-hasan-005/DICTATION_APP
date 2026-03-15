const asyncHandler   = require('../utils/asyncHandler');
const authService    = require('../services/authService');
const userRepository = require('../repositories/userRepository');
const AppError       = require('../utils/AppError');

const protect = asyncHandler(async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) throw new AppError('Not authorised — no token', 401);
  const decoded = authService.verifyToken(auth.split(' ')[1]);
  const user    = await userRepository.findById(decoded.id);
  if (!user) throw new AppError('User no longer exists', 401);
  req.user = user;
  next();
});

module.exports = { protect };
