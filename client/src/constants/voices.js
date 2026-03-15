// Voice options that apply to both Google Cloud TTS and browser speech synthesis.

export const GENDERS = [
  { value: 'female', icon: '👩‍🏫', label: 'Female' },
  { value: 'male',   icon: '👨‍🏫', label: 'Male'   },
];

export const ACCENTS = [
  { value: 'american', icon: '🇺🇸', label: 'American', lang: 'en-US' },
  { value: 'british',  icon: '🇬🇧', label: 'British',  lang: 'en-GB' },
  { value: 'indian',   icon: '🇮🇳', label: 'Indian',   lang: 'en-IN' },
];

export const DEFAULT_GENDER = 'female';
export const DEFAULT_ACCENT = 'american';

export const getAccentLang   = (accent) =>
  ACCENTS.find(a => a.value === accent)?.lang || 'en-US';

export const getAccentIcon   = (accent) =>
  ACCENTS.find(a => a.value === accent)?.icon || '🇺🇸';

export const getAccentLabel  = (accent) =>
  ACCENTS.find(a => a.value === accent)?.label || 'American';

export const getGenderLabel  = (gender) =>
  GENDERS.find(g => g.value === gender)?.label || 'Female';
