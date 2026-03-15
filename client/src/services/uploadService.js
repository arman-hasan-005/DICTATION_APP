import http from './http';
import { API } from '../constants/api';

const uploadService = {
  /**
   * Upload a file and extract text from it.
   * Returns extracted text (PDF/DOCX/TXT) or base64 image data for client OCR.
   * @param {File} file - The file object from an <input type="file">
   */
  extractText: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post(API.UPLOAD.EXTRACT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default uploadService;
