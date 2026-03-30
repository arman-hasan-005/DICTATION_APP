const Passage = require("../models/Passage");

const passageRepository = {
  // ── Standard CRUD ─────────────────────────────────────────────────────────
  findAll: (filters = {}) => {
    const q = { isActive: true };
    if (filters.level) q.level = filters.level;
    return Passage.find(q).select("-audioFiles.data").sort({ createdAt: -1 });
  },

  findById: (id) => Passage.findById(id).select("-audioFiles.data"),

  findByIdWithAudio: (id) => Passage.findById(id),

  findRandom: async (level) => {
    const q = { isActive: true };
    if (level) q.level = level;
    const count = await Passage.countDocuments(q);
    return Passage.findOne(q)
      .select("-audioFiles.data")
      .skip(Math.floor(Math.random() * count));
  },

  create: (data) => Passage.create(data),

  updateById: (id, u) =>
    Passage.findByIdAndUpdate(id, { $set: u }, { new: true }).select(
      "-audioFiles.data",
    ),

  // ── Audio file management ─────────────────────────────────────────────────

  /**
   * Upsert audio for a specific sentenceIndex + voice + accent combination.
   * Each combination is stored separately so different voice settings
   * each get their own cached audio file.
   */
  upsertAudioFile: async (
    passageId,
    sentenceIndex,
    voice,
    accent,
    data,
    contentType = "audio/mpeg",
  ) => {
    // Remove existing entry for this exact combination
    await Passage.updateOne(
      { _id: passageId },
      { $pull: { audioFiles: { sentenceIndex, voice, accent } } },
    );
    // Push new entry
    return Passage.findByIdAndUpdate(
      passageId,
      {
        $push: {
          audioFiles: {
            sentenceIndex,
            voice,
            accent,
            data,
            contentType,
            uploadedAt: new Date(),
          },
        },
      },
      { new: true },
    ).select("-audioFiles.data");
  },

  /**
   * Find audio for a specific sentenceIndex + voice + accent combination.
   */
  findAudioFile: async (passageId, sentenceIndex, voice, accent) => {
    const passage = await Passage.findById(passageId);
    if (!passage) return null;
    return (
      passage.audioFiles?.find(
        (af) =>
          af.sentenceIndex === sentenceIndex &&
          af.voice === voice &&
          af.accent === accent,
      ) || null
    );
  },

  /**
   * Delete stored audio for a specific sentenceIndex + voice + accent.
   * If voice/accent not provided, deletes all audio for that sentenceIndex.
   */
  deleteAudioFile: (passageId, sentenceIndex, voice, accent) => {
    const pull =
      voice && accent ? { sentenceIndex, voice, accent } : { sentenceIndex };
    return Passage.findByIdAndUpdate(
      passageId,
      { $pull: { audioFiles: pull } },
      { new: true },
    ).select("-audioFiles.data");
  },
};

module.exports = passageRepository;
