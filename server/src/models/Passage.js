const mongoose = require('mongoose');
const { LEVELS } = require('../utils/constants');

/**
 * audioFiles stores pre-recorded audio per sentence.
 * The actual audio bytes are kept as a Buffer in MongoDB.
 * When the passage is serialised to JSON (API response), the buffer is
 * NOT included — only the list of sentence indexes that have audio is sent,
 * so the client knows which sentences can be fetched from /audio/:index.
 */
const audioFileSchema = new mongoose.Schema({
  sentenceIndex: { type: Number, required: true },
  data:          { type: Buffer, required: true },
  contentType:   { type: String, default: 'audio/mpeg' },
  uploadedAt:    { type: Date,   default: Date.now },
}, { _id: false });

const passageSchema = new mongoose.Schema({
  title:     { type: String, required: true, trim: true },
  text:      { type: String, required: true },
  sentences: [{ type: String }],
  level:     { type: String, enum: Object.values(LEVELS), default: LEVELS.BEGINNER, index: true },
  wordCount: { type: Number, default: 0 },
  isActive:  { type: Boolean, default: true },
  audioFiles: [audioFileSchema],
}, { timestamps: true });

// Auto-split text into sentences and count words on save
passageSchema.pre('save', function (next) {
  if (this.isModified('text')) {
    this.wordCount = this.text.split(/\s+/).filter(Boolean).length;
    if (!this.sentences || this.sentences.length === 0) {
      this.sentences = this.text
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(Boolean);
    }
  }
  next();
});

/**
 * Custom toJSON: strip the raw audio buffers from the response.
 * Send only the sentence indexes that have stored audio so the client
 * can decide whether to fetch audio or fall back to browser speech.
 */
passageSchema.methods.toJSON = function () {
  const obj = this.toObject();
  // Replace audioFiles array (which contains raw buffers) with just indexes
  obj.audioIndexes = (obj.audioFiles || []).map(af => af.sentenceIndex);
  delete obj.audioFiles;
  return obj;
};

module.exports = mongoose.model('Passage', passageSchema);
