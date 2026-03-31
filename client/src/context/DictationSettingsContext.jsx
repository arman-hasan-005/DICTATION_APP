import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_DICTATION_SETTINGS } from '../constants/dictationSettings';
import authService from '../services/authService';

const DictationSettingsContext = createContext(null);
const LS_KEY = 'dictationSettings';

const load = () => {
  try {
    const stored = localStorage.getItem(LS_KEY);
    return stored
      ? { ...DEFAULT_DICTATION_SETTINGS, ...JSON.parse(stored) }
      : { ...DEFAULT_DICTATION_SETTINGS };
  } catch {
    return { ...DEFAULT_DICTATION_SETTINGS };
  }
};

export function DictationSettingsProvider({ children }) {
  const [settings, setSettings] = useState(load);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(settings));
  }, [settings]);

  const syncFromUser = useCallback((user) => {
    if (!user) return;
    setSettings(prev => ({
      ...prev,
      ...(user.dictationSettings || {}),
      voice:  user.dictationSettings?.voice  ?? user.preferredVoice  ?? prev.voice,
      accent: user.dictationSettings?.accent ?? user.preferredAccent ?? prev.accent,
    }));
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      authService.updateProfile({
        dictationSettings: next,
        preferredVoice:    next.voice,
        preferredAccent:   next.accent,
      }).catch(() => {});
      return next;
    });
  }, []);

  return (
    <DictationSettingsContext.Provider value={{ settings, updateSettings, syncFromUser }}>
      {children}
    </DictationSettingsContext.Provider>
  );
}

export const useDictationSettings = () => {
  const ctx = useContext(DictationSettingsContext);
  if (!ctx) throw new Error('useDictationSettings must be used inside DictationSettingsProvider');
  return ctx;
};
