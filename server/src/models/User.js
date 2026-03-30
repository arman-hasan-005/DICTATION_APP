const mongoose = require("mongoose");
const { LEVELS } = require("../utils/constants");

const dictationSettingsSchema = {
  voice: { type: String, enum: ["female", "male"], default: "female" },
  accent: {
    type: String,
    enum: ["american", "british", "indian"],
    default: "american",
  },
  speed: { type: Number, default: 1.0, min: 0.25, max: 2.0 },
  repeatCount: { type: Number, default: 1, min: 1, max: 5 },
  pauseDuration: { type: Number, default: 2, min: 0, max: 15 },
  autoAdvance: { type: Boolean, default: false },
};

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },

    xp: { type: Number, default: 0, min: 0 },
    streak: { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 },
    lastActiveDate: { type: Date, default: null },

    badges: [
      {
        id: String,
        name: String,
        icon: String,
        earnedAt: { type: Date, default: Date.now },
      },
    ],

    totalSessions: { type: Number, default: 0 },
    totalWords: { type: Number, default: 0 },
    totalCorrectWords: { type: Number, default: 0 },

    preferredLevel: {
      type: String,
      enum: Object.values(LEVELS),
      default: LEVELS.BEGINNER,
    },
    preferredVoice: {
      type: String,
      enum: ["female", "male"],
      default: "female",
    },
    preferredAccent: {
      type: String,
      enum: ["american", "british", "indian"],
      default: "british",
    },

    dictationSettings: {
      type: dictationSettingsSchema,
      default: () => ({
        voice: "female",
        accent: "british",
        speed: 1.0,
        repeatCount: 2,
        pauseDuration: 3,
        autoAdvance: true,
      }),
    },
  },
  { timestamps: true },
);

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
