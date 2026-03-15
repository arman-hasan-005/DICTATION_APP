export const API = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN:    '/auth/login',
    ME:       '/auth/me',
    PROFILE:  '/auth/profile',
  },
  SESSIONS: {
    BASE:   '/sessions',
    BY_ID: (id) => `/sessions/${id}`,
  },
  PASSAGES: {
    BASE:       '/passages',
    BY_ID:      (id) => `/passages/${id}`,
    RANDOM:     '/passages/random',
    TTS:        '/passages/tts',              // Google TTS — uploaded content only
    TTS_STATUS: '/passages/tts/status',       // check if Google TTS is configured
    AUDIO:      (id, idx) => `/passages/${id}/audio/${idx}`,  // stored audio
    AUDIO_BASE: (id)      => `/passages/${id}/audio`,         // upload audio
  },
  LEADERBOARD: {
    BASE:    '/leaderboard',
    BY_TYPE: (type) => `/leaderboard?type=${type}`,
  },
  UPLOAD: {
    EXTRACT: '/upload/extract',
  },
};
