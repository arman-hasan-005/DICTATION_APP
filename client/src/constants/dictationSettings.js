// Speed is applied client-side via Audio.playbackRate (works for both
// stored audio and Google TTS audio).
// Browser TTS speed is applied via SpeechSynthesisUtterance.rate.

export const SPEED_OPTIONS = [
  { value: 0.5, label: "0.5× (Very Slow)" },
  { value: 0.75, label: "0.75× (Slow)" },
  { value: 1.0, label: "1.0× (Normal)" },
  { value: 1.25, label: "1.25× (Fast)" },
  { value: 1.5, label: "1.5× (Very Fast)" },
];

export const REPEAT_OPTIONS = [1, 2, 3, 4, 5];

export const PAUSE_OPTIONS = [
  { value: 0, label: "No pause" },
  { value: 1, label: "1 second" },
  { value: 2, label: "2 seconds" },
  { value: 3, label: "3 seconds" },
  { value: 5, label: "5 seconds" },
  { value: 8, label: "8 seconds" },
  { value: 10, label: "10 seconds" },
  { value: 15, label: "15 seconds" },
];

export const SETTINGS_VERSION = 2;
// voice/accent apply to:
//   - Google TTS (uploaded content)
//   - Browser speech synthesis (fallback)
export const DEFAULT_DICTATION_SETTINGS = {
  voice: "female",
  accent: "british",
  speed: 1.0,
  repeatCount: 2,
  pauseDuration: 3,
  autoAdvance: true,
};

// Maps accent values to browser SpeechSynthesis language codes
export const ACCENT_TO_LANG = {
  american: "en-US",
  british: "en-GB",
  indian: "en-IN",
};
