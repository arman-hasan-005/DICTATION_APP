const passageRepository = require('../repositories/passageRepository');
const AppError = require('../utils/AppError');
const { LEVEL_LIST } = require('../utils/constants');

const passageService = {
  getAll: async (filters = {}) => {
    const validLevel = filters.level && LEVEL_LIST.includes(filters.level)
      ? filters.level : null;
    const passages = await passageRepository.findAll(validLevel ? { level: validLevel } : {});
    return { passages, count: passages.length };
  },

  getById: async (id) => {
    const p = await passageRepository.findById(id);
    if (!p) throw new AppError('Passage not found', 404);
    return p;
  },

  getRandom: async (level) => {
    const p = await passageRepository.findRandom(level);
    if (!p) throw new AppError('No passages found', 404);
    return p;
  },

  create: (data) => passageRepository.create(data),

  // ── Audio management ───────────────────────────────────────────────────────

  /**
   * Store an audio file for a specific sentence.
   * @param {string} passageId
   * @param {number} sentenceIndex
   * @param {Buffer} audioBuffer
   * @param {string} contentType
   */
  saveAudio: async (passageId, sentenceIndex, audioBuffer, contentType = 'audio/mpeg') => {
    const passage = await passageRepository.findById(passageId);
    if (!passage) throw new AppError('Passage not found', 404);

    const idx = parseInt(sentenceIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= passage.sentences.length) {
      throw new AppError(
        `Invalid sentenceIndex ${sentenceIndex}. Passage has ${passage.sentences.length} sentences.`,
        400
      );
    }

    return passageRepository.upsertAudioFile(passageId, idx, audioBuffer, contentType);
  },

  /**
   * Retrieve stored audio bytes for a sentence.
   * Returns { data: Buffer, contentType: string } or null if not stored.
   */
  getAudio: async (passageId, sentenceIndex) => {
    const passage = await passageRepository.findByIdWithAudio(passageId);
    if (!passage) throw new AppError('Passage not found', 404);

    const idx = parseInt(sentenceIndex, 10);
    const af = passage.audioFiles?.find(a => a.sentenceIndex === idx);
    if (!af) return null;

    return { data: af.data, contentType: af.contentType };
  },

  /**
   * Delete stored audio for a sentence.
   */
  deleteAudio: async (passageId, sentenceIndex) => {
    const passage = await passageRepository.findById(passageId);
    if (!passage) throw new AppError('Passage not found', 404);
    return passageRepository.deleteAudioFile(passageId, parseInt(sentenceIndex, 10));
  },
};

module.exports = passageService;
