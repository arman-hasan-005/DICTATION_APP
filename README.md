# DictaClass 🎙️

Full-stack dictation practice app — Listen → Type or Handwrite → Get scored.

## Quick Start

```bash
# Backend (Terminal 1)
cd server && npm install && npm run dev

# Frontend (Terminal 2)
cd client && npm install && npm run dev
```

Open: http://localhost:5173

---

## Environment — `server/.env`

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dictaclass
JWT_SECRET=your_long_random_secret_here

# Optional: Google Cloud TTS (for uploaded content — PDF, images, docs)
# If not set, uploaded content uses browser speech synthesis as fallback.
# Get a free API key: https://console.cloud.google.com → Text-to-Speech API
GOOGLE_TTS_KEY=your_google_cloud_api_key

CLIENT_URL=http://localhost:5173
```

---

## Voice System

DictaClass uses a **three-tier hybrid voice system** — no external service is required to run:

### Pre-written passages
1. **Stored audio** (📼) — Audio files can be uploaded per sentence and stored in MongoDB.
   The player fetches and streams them directly.
2. **Browser Voice** (🌐) — If no stored audio exists, the browser's built-in
   Web Speech API reads the sentence aloud. Works offline, no API key needed.

### Uploaded content (PDFs, images, documents)
1. **Google Cloud TTS** (☁️) — If `GOOGLE_TTS_KEY` is set, Google generates
   high-quality MP3 audio for each sentence.
2. **Browser Voice** (🌐) — Automatic fallback if Google TTS is unavailable,
   not configured, or returns an error. The user never sees a broken state.

The active voice source is shown in the player as a coloured badge during dictation.

---

## Uploading audio for passages (admin)

Pre-recorded audio can be stored per sentence via the API:

```bash
# Upload MP3 for sentence 0 of a passage
curl -X POST http://localhost:5000/api/passages/:passageId/audio \
  -H "Authorization: Bearer TOKEN" \
  -F "sentenceIndex=0" \
  -F "audioFile=@sentence_0.mp3"

# Check which sentences have stored audio
curl http://localhost:5000/api/passages/:passageId \
  -H "Authorization: Bearer TOKEN"
# Response includes: audioIndexes: [0, 1, 2, ...]

# Delete stored audio for sentence 0
curl -X DELETE http://localhost:5000/api/passages/:passageId/audio/0 \
  -H "Authorization: Bearer TOKEN"
```

---

## Architecture

```
client/   React 19 + Vite — feature-sliced structure
server/   Node.js + Express + MongoDB
  config/
    googleTTS.js   — Google Cloud TTS REST wrapper
    multer.js      — file upload config
  models/
    Passage.js     — includes audioFiles[] with Buffer storage
  services/
    passageService.js   — saveAudio / getAudio / deleteAudio
  controllers/
    passageController.js — /tts (Google TTS) + /audio/:idx (stored audio)
```
