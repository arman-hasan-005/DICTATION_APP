/**
 * DictationSettingsContext
 *
 * REFACTORING vs original:
 *
 *   DEBOUNCED SERVER SYNC:
 *     The original `updateSettings` called `authService.updateProfile()`
 *     synchronously on *every* setting change — including each tick of the
 *     speed slider. This fires up to ~10 API requests per second while the
 *     user drags the slider.
 *
 *     Fix: useEffect watches `settings` through a 600ms debounce. The server
 *     is only called once the user stops interacting, regardless of how many
 *     intermediate values were set.
 *
 *   SEPARATION OF CONCERNS:
 *     - `updateSettings` now only updates local state (single responsibility).
 *     - Server sync is a separate effect — easier to test, toggle, or replace.
 *
 *   PERFORMANCE:
 *     - `updateSettings` uses functional setState to avoid needing `settings`
 *       in its dependency array (prevents unnecessary re-creations).
 *     - `syncFromUser` is stable via useCallback.
 *
 *   ROBUSTNESS:
 *     - Skip the initial mount sync (don't overwrite local state on startup).
 *     - Cleanup: debounce timer is cleared on unmount.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { DEFAULT_DICTATION_SETTINGS } from '../constants/dictationSettings';
import authService from '../services/authService';

const DictationSettingsContext = createContext(null);

const LS_KEY = 'dictationSettings';

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(LS_KEY);
    return stored
      ? { ...DEFAULT_DICTATION_SETTINGS, ...JSON.parse(stored) }
      : { ...DEFAULT_DICTATION_SETTINGS };
  } catch {
    return { ...DEFAULT_DICTATION_SETTINGS };
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export function DictationSettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadFromStorage);

  // Track whether we've mounted yet so we don't fire a sync on first load
  const isMountedRef   = useRef(false);
  const debounceRef    = useRef(null);

  // ── Persist to localStorage on every change ───────────────────────────────
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(settings));
  }, [settings]);

  // ── Debounced server sync (600ms after last change) ───────────────────────
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;                     // skip initial mount
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      authService
        .updateProfile({
          dictationSettings: settings,
          preferredVoice:    settings.voice,
          preferredAccent:   settings.accent,
        })
        .catch(() => {});         // fire-and-forget; local state is the source of truth
    }, 600);

    return () => clearTimeout(debounceRef.current);
  }, [settings]);

  // ── Sync from server (called after login / profile fetch) ─────────────────
  const syncFromUser = useCallback((user) => {
    if (!user) return;
    setSettings((prev) => ({
      ...prev,
      ...(user.dictationSettings ?? {}),
      voice:  user.dictationSettings?.voice  ?? user.preferredVoice  ?? prev.voice,
      accent: user.dictationSettings?.accent ?? user.preferredAccent ?? prev.accent,
    }));
  }, []);

  // ── Update settings (local only — server sync handled by effect above) ────
  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <DictationSettingsContext.Provider value={{ settings, updateSettings, syncFromUser }}>
      {children}
    </DictationSettingsContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function useDictationSettings() {
  const ctx = useContext(DictationSettingsContext);
  if (!ctx) {
    throw new Error('useDictationSettings must be used inside DictationSettingsProvider');
  }
  return ctx;
}
