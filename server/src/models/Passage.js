const mongoose = require("mongoose");
const { LEVELS } = require("../utils/constants");

/**
 * audioFiles stores TTS-cached audio per sentence per voice combination.
 * Each entry is keyed by sentenceIndex + voice + accent so each combination
 * gets its own cached audio file.
 *
 * The raw Buffer is excluded from API responses — only audioCache[] is sent
 * so the client knows which (sentenceIndex, voice, accent) combinations exist.
 */
const audioFileSchema = new mongoose.Schema(
  {
    sentenceIndex: { type: Number, required: true },
    voice: { type: String, default: "female" }, // 'female' | 'male'
    accent: { type: String, default: "american" }, // 'american' | 'british' | 'indian'
    data: { type: Buffer, required: true },
    contentType: { type: String, default: "audio/mpeg" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const passageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    text: { type: String, required: true },
    sentences: [{ type: String }],
    level: {
      type: String,
      enum: Object.values(LEVELS),
      default: LEVELS.BEGINNER,
      index: true,
    },
    wordCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    audioFiles: [audioFileSchema],
  },
  { timestamps: true },
);

// Auto-split text into sentences and count words on save
passageSchema.pre("save", function (next) {
  if (this.isModified("text")) {
    this.wordCount = this.text.split(/\s+/).filter(Boolean).length;
    if (!this.sentences || this.sentences.length === 0) {
      this.sentences = this.text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  next();
});

/**
 * Custom toJSON — strip raw audio buffers.
 * Send audioCache: [{ sentenceIndex, voice, accent }] so client knows
 * which combinations have cached audio without downloading the data.
 */
passageSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.audioCache = (obj.audioFiles || []).map((af) => ({
    sentenceIndex: af.sentenceIndex,
    voice: af.voice || "female",
    accent: af.accent || "american",
  }));
  // Keep audioIndexes for backwards compatibility
  obj.audioIndexes = [
    ...new Set((obj.audioFiles || []).map((af) => af.sentenceIndex)),
  ];
  delete obj.audioFiles;
  return obj;
};

module.exports = mongoose.model("Passage", passageSchema);
