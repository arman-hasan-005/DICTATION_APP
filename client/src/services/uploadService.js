import http from './http';
import { API } from '../constants/api';

const uploadService = {
  /** Extract text from PDF, DOCX, TXT, or image (image returns base64 for client OCR) */
  extractText: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return http.post(API.UPLOAD.EXTRACT, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Hybrid server-side OCR for handwriting mode.
   * Server runs Google Vision + Tesseract concurrently and merges results.
   * If all server engines fail, the response has requiresClientOCR: true.
   */
  ocrHandwriting: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return http.post(API.UPLOAD.OCR_HANDWRITING, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 35_000,   // Vision + Tesseract can take up to 25s on large images
    });
  },
};

export default uploadService;
