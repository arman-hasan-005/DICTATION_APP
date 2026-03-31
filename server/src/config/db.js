/**
 * db.js — MongoDB connection with production options
 *
 * CHANGES from original:
 *   - Uses Winston logger instead of console.log
 *   - Added connection pool size (maxPoolSize: 10)
 *   - Added serverSelectionTimeoutMS to fail fast on bad URI
 *   - Added socketTimeoutMS to prevent hung queries
 *   - Handles connection events for monitoring
 */

const mongoose = require('mongoose');
const { mongoURI } = require('./env');
const logger   = require('./logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongoURI, {
      maxPoolSize:               10,    // max concurrent connections
      serverSelectionTimeoutMS:  5000,  // fail fast if no server found
      socketTimeoutMS:           45000, // close sockets after 45s of inactivity
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error('MongoDB connection failed', { error: err.message });
    process.exit(1);
  }
};

// Log connection events (useful in production monitoring)
mongoose.connection.on('disconnected', () =>
  logger.warn('MongoDB disconnected')
);
mongoose.connection.on('reconnected', () =>
  logger.info('MongoDB reconnected')
);

module.exports = connectDB;
