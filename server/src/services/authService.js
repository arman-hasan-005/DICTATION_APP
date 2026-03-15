const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const AppError       = require('../utils/AppError');
const userRepository = require('../repositories/userRepository');

const authService = {
  hashPassword:    async (plain) => { const salt = await bcrypt.genSalt(10); return bcrypt.hash(plain, salt); },
  comparePassword: (plain, hash) => bcrypt.compare(plain, hash),
  generateToken:   (userId)      => jwt.sign({ id: userId }, jwtSecret, { expiresIn:'30d' }),
  verifyToken:     (token)       => jwt.verify(token, jwtSecret),

  register: async ({ name, email, password, preferredLevel }) => {
    const exists = await userRepository.findByEmail(email);
    if (exists) throw new AppError('An account with that email already exists', 400);
    const hashed = await authService.hashPassword(password);
    const user   = await userRepository.create({ name, email, password: hashed, preferredLevel: preferredLevel||'beginner' });
    const token  = authService.generateToken(user._id);
    return { user, token };
  },

  login: async ({ email, password }) => {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new AppError('Invalid email or password', 401);
    const match = await authService.comparePassword(password, user.password);
    if (!match) throw new AppError('Invalid email or password', 401);
    const token = authService.generateToken(user._id);
    return { user, token };
  },
};

module.exports = authService;
