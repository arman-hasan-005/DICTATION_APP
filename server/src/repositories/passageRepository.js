const Passage = require('../models/Passage');

const passageRepository = {
  // ── Standard CRUD ─────────────────────────────────────────────────────────
  findAll: (filters = {}) => {
    const q = { isActive: true };
    if (filters.level) q.level = filters.level;
    // Exclude raw audio buffers from list responses for performance
    return Passage.find(q).select('-audioFiles.data').sort({ createdAt: -1 });
  },

  findById: (id) =>
    // Also exclude buffer data — audio is served via a dedicated endpoint
    Passage.findById(id).select('-audioFiles.data'),

  findByIdWithAudio: (id) =>
    // Full document including buffers — only called when serving audio
    Passage.findById(id),

  findRandom: async (level) => {
    const q = { isActive: true };
    if (level) q.level = level;
    const count = await Passage.countDocuments(q);
    return Passage.findOne(q)
      .select('-audioFiles.data')
      .skip(Math.floor(Math.random() * count));
  },

  create: (data) => Passage.create(data),

  updateById: (id, u) =>
    Passage.findByIdAndUpdate(id, { $set: u }, { new: true }).select('-audioFiles.data'),

  // ── Audio file management ─────────────────────────────────────────────────

  /**
   * Upsert an audio file for a specific sentence index.
   * If an entry for that sentenceIndex already exists, replace it.
   */
  upsertAudioFile: async (passageId, sentenceIndex, data, contentType = 'audio/mpeg') => {
    // Remove any existing entry for this sentenceIndex first
    await Passage.updateOne(
      { _id: passageId },
      { $pull: { audioFiles: { sentenceIndex } } }
    );
    // Push the new entry
    return Passage.findByIdAndUpdate(
      passageId,
      {
        $push: {
          audioFiles: { sentenceIndex, data, contentType, uploadedAt: new Date() },
        },
      },
      { new: true }
    ).select('-audioFiles.data');
  },

  /**
   * Delete stored audio for a specific sentence.
   */
  deleteAudioFile: (passageId, sentenceIndex) =>
    Passage.findByIdAndUpdate(
      passageId,
      { $pull: { audioFiles: { sentenceIndex } } },
      { new: true }
    ).select('-audioFiles.data'),
};

module.exports = passageRepository;
