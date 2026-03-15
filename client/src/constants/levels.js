export const LEVELS = {
  BEGINNER:     'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED:     'advanced',
};
export const LEVEL_LIST = Object.values(LEVELS);
export const LEVEL_CONFIG = {
  beginner:     { label:'Beginner',     emoji:'🌱', color:'#059669', bgColor:'#ECFDF5', xpMultiplier:1.0 },
  intermediate: { label:'Intermediate', emoji:'🔥', color:'#D97706', bgColor:'#FFFBEB', xpMultiplier:1.5 },
  advanced:     { label:'Advanced',     emoji:'⚡', color:'#DC2626', bgColor:'#FEF2F2', xpMultiplier:2.0 },
};
export const getLevelConfig = (level) => LEVEL_CONFIG[level] || LEVEL_CONFIG.beginner;
