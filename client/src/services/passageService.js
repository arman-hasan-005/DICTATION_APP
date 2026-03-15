import http from './http';
import { API } from '../constants/api';

const passageService = {
  getAll:    (params) => http.get(API.PASSAGES.BASE, { params }),
  getById:   (id)     => http.get(API.PASSAGES.BY_ID(id)),
  getRandom: (level)  => http.get(API.PASSAGES.RANDOM, { params: { level } }),

  /** Check if Google TTS is configured on the server */
  getTTSStatus: () => http.get(API.PASSAGES.TTS_STATUS),

  /**
   * Generate TTS for uploaded content via Google Cloud TTS.
   * Returns either an audio/mpeg Blob OR JSON { fallback: true, text }
   * depending on server-side availability.
   * Use `responseType: 'blob'` — the caller must check Content-Type.
   */
  generateTTS: (text, voice, accent) =>
    http.post(API.PASSAGES.TTS, { text, voice, accent }, { responseType: 'blob' }),

  /**
   * Stream stored audio for a pre-written passage sentence.
   * Returns audio Blob or 404 JSON { noAudio: true }.
   */
  getSentenceAudio: (passageId, sentenceIndex) =>
    http.get(API.PASSAGES.AUDIO(passageId, sentenceIndex), { responseType: 'blob' }),

  /** Upload audio file for a passage sentence */
  uploadSentenceAudio: (passageId, sentenceIndex, audioBlob, contentType = 'audio/mpeg') => {
    const formData = new FormData();
    formData.append('sentenceIndex', sentenceIndex);
    formData.append('audioFile', audioBlob, `sentence_${sentenceIndex}.mp3`);
    return http.post(API.PASSAGES.AUDIO_BASE(passageId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Delete stored audio for a passage sentence */
  deleteSentenceAudio: (passageId, sentenceIndex) =>
    http.delete(API.PASSAGES.AUDIO(passageId, sentenceIndex)),
};

export default passageService;
