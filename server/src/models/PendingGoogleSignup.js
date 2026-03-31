/**
 * PendingGoogleSignup — temporary holding document for the Google signup flow.
 *
 * Created when a new user authenticates with Google via the signup intent.
 * Lives through three stages:
 *   1. Created       — OTP generated & emailed, not yet verified
 *   2. otpVerified   — OTP confirmed, awaiting profile completion
 *   3. (deleted)     — after User.create() succeeds
 *
 * TTL index auto-deletes abandoned documents after 30 minutes so the
 * collection never grows stale.
 */

const mongoose = require('mongoose');

const pendingGoogleSignupSchema = new mongoose.Schema({
  googleId:    { type: String, required: true, unique: true },
  email:       { type: String, required: true, lowercase: true, trim: true },
  name:        { type: String, required: true },
  otpHash:     { type: String, required: true },
  otpExpiry:   { type: Date,   required: true },
  otpVerified: { type: Boolean, default: false },
  createdAt:   { type: Date,   default: Date.now, expires: 1800 },  // TTL: 30 min
});

module.exports = mongoose.model('PendingGoogleSignup', pendingGoogleSignupSchema);
