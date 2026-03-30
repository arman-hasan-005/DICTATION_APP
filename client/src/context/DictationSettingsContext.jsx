import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  DEFAULT_DICTATION_SETTINGS,
  SETTINGS_VERSION,
} from "../constants/dictationSettings";
import { AuthContext } from "./AuthContext";
import authService from "../services/authService";

const DictationSettingsContext = createContext(null);
const LS_KEY = "dictationSettings";

/**
 * Load settings from localStorage.
 * If the stored version is older than SETTINGS_VERSION (or missing),
 * ignore stored values and return fresh defaults.
 * This ensures existing users get new defaults after an update.
 */
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (!stored) return { ...DEFAULT_DICTATION_SETTINGS };

    const parsed = JSON.parse(stored);

    // Version check — if stale, discard and use new defaults
    if (!parsed._version || parsed._version < SETTINGS_VERSION) {
      localStorage.removeItem(LS_KEY);
      return { ...DEFAULT_DICTATION_SETTINGS };
    }

    return { ...DEFAULT_DICTATION_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_DICTATION_SETTINGS };
  }
};

export function DictationSettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadFromStorage);
  const [synced, setSynced] = useState(false);

  const auth = useContext(AuthContext);
  const user = auth?.user;

  // ── Sync from server user profile on login ─────────────────────────────────
  useEffect(() => {
    if (!user) {
      setSynced(false);
      return;
    }
    if (synced) return;

    const dbSettings = user.dictationSettings || {};

    // If DB settings are on an old version (or missing _version),
    // treat them as stale and push new defaults to the server.
    const dbVersion = dbSettings._version || 0;

    if (dbVersion < SETTINGS_VERSION) {
      // DB has old/default values — apply new defaults, save to DB
      const fresh = { ...DEFAULT_DICTATION_SETTINGS };
      setSettings(fresh);
      localStorage.setItem(LS_KEY, JSON.stringify(fresh));

      // Push new defaults to server so DB is up to date
      authService
        .updateProfile({
          dictationSettings: fresh,
          preferredVoice: fresh.voice,
          preferredAccent: fresh.accent,
        })
        .catch(() => {});
    } else {
      // DB has up-to-date user-customized settings — use them
      const merged = {
        ...DEFAULT_DICTATION_SETTINGS,
        ...dbSettings,
        voice:
          dbSettings.voice ??
          user.preferredVoice ??
          DEFAULT_DICTATION_SETTINGS.voice,
        accent:
          dbSettings.accent ??
          user.preferredAccent ??
          DEFAULT_DICTATION_SETTINGS.accent,
      };
      setSettings(merged);
      localStorage.setItem(LS_KEY, JSON.stringify(merged));
    }

    setSynced(true);
  }, [user, synced]);

  // ── Persist to localStorage on every change ────────────────────────────────
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(settings));
  }, [settings]);

  // ── Update settings and sync to server ────────────────────────────────────
  const updateSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        ...patch,
        _version: SETTINGS_VERSION, // always stamp current version
      };
      authService
        .updateProfile({
          dictationSettings: next,
          preferredVoice: next.voice,
          preferredAccent: next.accent,
        })
        .catch(() => {});
      return next;
    });
  }, []);

  return (
    <DictationSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </DictationSettingsContext.Provider>
  );
}

export const useDictationSettings = () => {
  const ctx = useContext(DictationSettingsContext);
  if (!ctx)
    throw new Error(
      "useDictationSettings must be used inside DictationSettingsProvider",
    );
  return ctx;
};
