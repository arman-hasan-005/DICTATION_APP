/**
 * usePassageAudio
 *
 * Encapsulates the three-tier audio resolution strategy that was previously
 * inlined inside DictationPage (~80 lines). Extracting it:
 *
 *   1. Keeps DictationPage focused on layout/orchestration.
 *   2. Makes the audio logic independently testable.
 *   3. Makes the fallback chain easy to read and extend.
 *
 * RESOLUTION ORDER (per sentence):
 *   1. Stored audio (MongoDB Buffer) — fastest, free
 *   2. Google TTS     — high quality; auto-caches result to DB in background
 *   3. Browser Speech — zero-cost fallback; works offline
 *
 * RETURNS
 *   getAudioSource(text, index) → Promise<AudioSource>
 *
 *   AudioSource is one of:
 *     { type: 'blob',    blob: Blob, sourceType: 'stored' | 'google' }
 *     { type: 'browser', text: string }
 */

import { useRef, useCallback } from 'react';
import http from '../../../services/http';

// ─────────────────────────────────────────────────────────────────────────────

export function usePassageAudio({ passage, voice, accent }) {
  // Track which (sentenceIndex, voice, accent) combos have cached audio.
  // Initialised from the passage manifest so we skip the DB round-trip
  // for sentences that already have audio stored.
  const cachedKeysRef = useRef(
    new Set(
      (passage?.audioCache ?? []).map(
        (a) => `${a.sentenceIndex}_${a.voice}_${a.accent}`,
      ),
    ),
  );

  // ── Private helpers ────────────────────────────────────────────────────────

  const _callGoogleTTS = useCallback(
    async (text) => {
      try {
        const res = await http.post(
          '/passages/tts',
          { text, voice, accent },
          { responseType: 'blob' },
        );
        const blob        = res.data;
        const contentType = res.headers?.['content-type'] ?? blob?.type ?? '';
        // Server returns JSON { fallback: true } when TTS is unavailable
        if (contentType.includes('application/json') || contentType.includes('text/')) {
          return null;
        }
        return blob?.size > 100 ? blob : null;
      } catch {
        return null;
      }
    },
    [voice, accent],
  );

  const _saveAudioInBackground = useCallback(
    async (passageId, sentenceIndex, blob) => {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            '',
          ),
        );
        await http.post(`/passages/${passageId}/audio`, {
          sentenceIndex,
          audioBase64: base64,
          contentType: 'audio/mpeg',
          voice,
          accent,
        });
        cachedKeysRef.current.add(`${sentenceIndex}_${voice}_${accent}`);
      } catch {
        // Silently ignore — audio already played, caching is best-effort
      }
    },
    [voice, accent],
  );

  const _fetchStoredAudio = useCallback(
    async (passageId, sentenceIndex) => {
      try {
        const res = await http.get(
          `/passages/${passageId}/audio/${sentenceIndex}`,
          { responseType: 'blob', params: { voice, accent } },
        );
        const blob        = res.data;
        const contentType = res.headers?.['content-type'] ?? blob?.type ?? '';
        if (!contentType.includes('application/json') && blob?.size > 100) {
          return blob;
        }
      } catch { /* fall through */ }
      return null;
    },
    [voice, accent],
  );

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Resolve the best available audio source for a sentence.
   * Called by useClassroomPlayer on each play event.
   */
  const getAudioSource = useCallback(
    async (sentenceText, sentenceIndex) => {
      if (!sentenceText?.trim()) {
        return { type: 'browser', text: sentenceText };
      }

      // ── Uploaded content → Google TTS → browser ──────────────────────────
      if (passage?.isUploaded) {
        const blob = await _callGoogleTTS(sentenceText);
        if (blob) return { type: 'blob', blob, sourceType: 'google' };
        return { type: 'browser', text: sentenceText };
      }

      // ── Pre-written passage ───────────────────────────────────────────────
      const passageId = passage?._id;
      const isRealPassage = passageId && !passageId.startsWith('upload_');
      const cacheKey = `${sentenceIndex}_${voice}_${accent}`;

      const hasStoredAudio =
        isRealPassage &&
        (cachedKeysRef.current.has(cacheKey) ||
          (passage?.audioCache ?? []).some(
            (a) =>
              a.sentenceIndex === sentenceIndex &&
              a.voice  === voice &&
              a.accent === accent,
          ));

      // Step 1 — Try stored audio
      if (hasStoredAudio) {
        const blob = await _fetchStoredAudio(passageId, sentenceIndex);
        if (blob) return { type: 'blob', blob, sourceType: 'stored' };
      }

      // Step 2 — Google TTS + auto-cache
      if (isRealPassage) {
        const blob = await _callGoogleTTS(sentenceText);
        if (blob) {
          _saveAudioInBackground(passageId, sentenceIndex, blob.slice(0, blob.size, blob.type));
          return { type: 'blob', blob, sourceType: 'google' };
        }
      }

      // Step 3 — Browser fallback
      return { type: 'browser', text: sentenceText };
    },
    [passage, voice, accent, _callGoogleTTS, _fetchStoredAudio, _saveAudioInBackground],
  );

  return { getAudioSource };
}
