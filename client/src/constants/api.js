export const API = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN:    '/auth/login',
    ME:       '/auth/me',
    PROFILE:  '/auth/profile',
    PASSWORD: '/auth/password',          // ← new
  },
  SESSIONS: {
    BASE:   '/sessions',
    BY_ID:  (id) => `/sessions/${id}`,
  },
  PASSAGES: {
    BASE:       '/passages',
    BY_ID:      (id) => `/passages/${id}`,
    RANDOM:     '/passages/random',
    TTS:        '/passages/tts',
    TTS_STATUS: '/passages/tts/status',
    AUDIO:      (id, idx) => `/passages/${id}/audio/${idx}`,
    AUDIO_BASE: (id)      => `/passages/${id}/audio`,
  },
  LEADERBOARD: {
    BASE:    '/leaderboard',
    BY_TYPE: (type) => `/leaderboard?type=${type}`,
  },
  UPLOAD: {
    EXTRACT: '/upload/extract',
  },
};
