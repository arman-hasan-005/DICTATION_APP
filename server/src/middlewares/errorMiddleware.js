const { isDev } = require('../config/env');

const errorHandler = (err, req, res, next) => { // eslint-disable-line
  // Handle multer-specific errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File is too large. Maximum size is 15 MB.' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ success: false, message: 'Unexpected file field.' });
  }
  if (err.message?.includes('Unsupported file type')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  const statusCode = err.statusCode || 500;
  const message    = err.isOperational ? err.message : 'Something went wrong. Please try again.';
  if (isDev) console.error(`[${statusCode}] ${err.message}`, !err.isOperational ? err.stack : '');
  res.status(statusCode).json({ success: false, message });
};

process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));

module.exports = errorHandler;
