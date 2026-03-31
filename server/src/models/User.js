/**
 * User model
 *
 * CRITICAL FIX — select: false on OTP / reset-token fields:
 *
 * Previously emailOtp, emailOtpExpiry, resetPasswordToken, resetPasswordExpiry
 * all had select: false. This caused Mongoose 8.x projection inconsistencies:
 * mixing +deselectedField with +normalField in a single .select() call produced
 * undefined for the deselected field even when it was stored in MongoDB.
 *
 * Fix: remove select: false from all four fields.
 * Security is maintained by toJSON() which already deletes every one of these
 * fields before any object is serialised to an API response.
 *
 * password keeps select: false (intentional — prevents accidental exposure).
 */

const mongoose = require('mongoose');
const { LEVELS } = require('../utils/constants');

const dictationSettingsSchema = {
  voice:         { type: String, enum: ['female', 'male'],                default: 'female'   },
  accent:        { type: String, enum: ['american', 'british', 'indian'], default: 'american' },
  speed:         { type: Number, default: 1.0,  min: 0.25, max: 2.0 },
  repeatCount:   { type: Number, default: 1,    min: 1,    max: 5   },
  pauseDuration: { type: Number, default: 2,    min: 0,    max: 15  },
  autoAdvance:   { type: Boolean, default: false },
};

const userSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId:     { type: String, default: null, sparse: true },

    // password excluded by default — must be explicitly requested via +password
    password: { type: String, minlength: 6, select: false },

    // ── Email verification ─────────────────────────────────────────────────────
    isEmailVerified: { type: Boolean, default: false },
    emailOtp:        { type: String,  default: null  },   // no select:false — toJSON() strips it
    emailOtpExpiry:  { type: Date,    default: null  },   // no select:false — toJSON() strips it

    // ── Password reset ─────────────────────────────────────────────────────────
    resetPasswordToken:  { type: String, default: null },  // no select:false — toJSON() strips it
    resetPasswordExpiry: { type: Date,   default: null },  // no select:false — toJSON() strips it

    // ── Gamification ───────────────────────────────────────────────────────────
    xp:            { type: Number, default: 0, min: 0 },
    streak:        { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 },
    lastActiveDate:{ type: Date,   default: null },

    badges: [{
      id:       String,
      name:     String,
      icon:     String,
      earnedAt: { type: Date, default: Date.now },
    }],

    totalSessions:     { type: Number, default: 0 },
    totalWords:        { type: Number, default: 0 },
    totalCorrectWords: { type: Number, default: 0 },

    preferredLevel:  { type: String, enum: Object.values(LEVELS), default: LEVELS.BEGINNER },
    preferredVoice:  { type: String, enum: ['female', 'male'],                default: 'female'  },
    preferredAccent: { type: String, enum: ['american', 'british', 'indian'], default: 'british' },

    dictationSettings: {
      type:    dictationSettingsSchema,
      default: () => ({ voice: 'female', accent: 'british', speed: 1.0, repeatCount: 2, pauseDuration: 3, autoAdvance: true }),
    },
  },
  { timestamps: true },
);

// Strip ALL sensitive fields from every JSON serialisation — this is the
// single source of truth for what must never reach the client.
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailOtp;
  delete obj.emailOtpExpiry;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpiry;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
