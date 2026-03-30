const passageRepository = require("../repositories/passageRepository");
const AppError = require("../utils/AppError");

const passageService = {
  getAll: async (filters) => passageRepository.findAll(filters),

  getById: async (id) => {
    const passage = await passageRepository.findById(id);
    if (!passage) throw new AppError("Passage not found", 404);
    return passage;
  },

  getRandom: async (level) => passageRepository.findRandom(level),

  create: async (data) => {
    if (!data.title?.trim()) throw new AppError("Title is required", 400);
    if (!data.text?.trim()) throw new AppError("Text is required", 400);
    return passageRepository.create(data);
  },

  /**
   * Save audio for sentenceIndex + voice + accent combination.
   * Each combination is stored separately.
   */
  saveAudio: async (
    passageId,
    sentenceIndex,
    voice,
    accent,
    audioBuffer,
    contentType = "audio/mpeg",
  ) => {
    const passage = await passageRepository.findById(passageId);
    if (!passage) throw new AppError("Passage not found", 404);

    const idx = parseInt(sentenceIndex, 10);
    if (isNaN(idx) || idx < 0) {
      throw new AppError(`Invalid sentenceIndex ${sentenceIndex}.`, 400);
    }

    return passageRepository.upsertAudioFile(
      passageId,
      idx,
      voice || "female",
      accent || "american",
      audioBuffer,
      contentType,
    );
  },

  /**
   * Get audio for sentenceIndex + voice + accent combination.
   * Returns null if not found.
   */
  getAudio: async (passageId, sentenceIndex, voice, accent) => {
    const idx = parseInt(sentenceIndex, 10);
    const af = await passageRepository.findAudioFile(
      passageId,
      idx,
      voice || "female",
      accent || "american",
    );
    if (!af) return null;
    return { data: af.data, contentType: af.contentType };
  },

  /**
   * Delete audio for sentenceIndex + voice + accent combination.
   * If voice/accent omitted, deletes all audio for that sentence.
   */
  deleteAudio: async (passageId, sentenceIndex, voice, accent) => {
    const passage = await passageRepository.findById(passageId);
    if (!passage) throw new AppError("Passage not found", 404);
    return passageRepository.deleteAudioFile(
      passageId,
      parseInt(sentenceIndex, 10),
      voice,
      accent,
    );
  },
};

module.exports = passageService;
