/**
 * http.js — Axios instance
 *
 * CHANGES from original:
 *   - Response interceptor unwraps the { success: true, data: ... } envelope
 *     so all service callers receive res.data directly (no change to call sites)
 *   - 401 redirect de-duped with a flag to prevent redirect storms
 *   - Timeout increased to 30s for TTS audio generation requests
 */

import axios from 'axios';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

// ── Request: inject auth token ────────────────────────────────────────────────
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: unwrap envelope + handle 401 ────────────────────────────────────
let isRedirecting = false;

http.interceptors.response.use(
  (res) => {
    // Unwrap { success: true, data: ... } → res.data becomes the inner data
    // Audio blob responses (Content-Type: audio/mpeg) pass through unchanged
    if (res.data && typeof res.data === 'object' && 'success' in res.data && 'data' in res.data) {
      res.data = res.data.data;
    }
    return res;
  },
  (err) => {
    if (err.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      // Reset flag after redirect completes
      setTimeout(() => { isRedirecting = false; }, 2000);
    }
    return Promise.reject(err);
  },
);

export default http;
