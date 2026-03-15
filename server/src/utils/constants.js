const LEVELS    = { BEGINNER:'beginner', INTERMEDIATE:'intermediate', ADVANCED:'advanced' };
const LEVEL_LIST = Object.values(LEVELS);
const XP_MULTIPLIERS = { beginner:1.0, intermediate:1.5, advanced:2.0 };
const BASE_XP_RATE = 2;
const BADGES = {
  FIRST_STEP:    { id:'first_step',    name:'First Step',    icon:'👣' },
  PERFECT_SCORE: { id:'perfect_score', name:'Perfect Score', icon:'💯' },
  STREAK_3:      { id:'streak_3',      name:'On Fire',       icon:'🔥' },
  STREAK_7:      { id:'streak_7',      name:'Weekly Warrior',icon:'⚔️' },
  STREAK_30:     { id:'streak_30',     name:'Unstoppable',   icon:'🏆' },
  XP_100:        { id:'xp_100',        name:'Rising Star',   icon:'⭐' },
  XP_500:        { id:'xp_500',        name:'XP Hunter',     icon:'🌟' },
  XP_1000:       { id:'xp_1000',       name:'Legend',        icon:'👑' },
  SESSIONS_10:   { id:'sessions_10',   name:'Dedicated',     icon:'📚' },
  SESSIONS_50:   { id:'sessions_50',   name:'Master',        icon:'🎓' },
  HIGH_ACCURACY: { id:'high_accuracy', name:'Sharp Ears',    icon:'👂' },
  HANDWRITER:    { id:'handwriter',    name:'Handwriter',    icon:'✍️' },
};
module.exports = { LEVELS, LEVEL_LIST, XP_MULTIPLIERS, BASE_XP_RATE, BADGES };
