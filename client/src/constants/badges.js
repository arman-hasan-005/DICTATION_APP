export const BADGES = {
  FIRST_STEP:    { id:'first_step',    name:'First Step',    icon:'👣', condition:'Complete 1 session' },
  PERFECT_SCORE: { id:'perfect_score', name:'Perfect Score', icon:'💯', condition:'Score 100%' },
  STREAK_3:      { id:'streak_3',      name:'On Fire',       icon:'🔥', condition:'3-day streak' },
  STREAK_7:      { id:'streak_7',      name:'Weekly Warrior',icon:'⚔️', condition:'7-day streak' },
  STREAK_30:     { id:'streak_30',     name:'Unstoppable',   icon:'🏆', condition:'30-day streak' },
  XP_100:        { id:'xp_100',        name:'Rising Star',   icon:'⭐', condition:'100 XP earned' },
  XP_500:        { id:'xp_500',        name:'XP Hunter',     icon:'🌟', condition:'500 XP earned' },
  XP_1000:       { id:'xp_1000',       name:'Legend',        icon:'👑', condition:'1000 XP earned' },
  SESSIONS_10:   { id:'sessions_10',   name:'Dedicated',     icon:'📚', condition:'10 sessions done' },
  SESSIONS_50:   { id:'sessions_50',   name:'Master',        icon:'🎓', condition:'50 sessions done' },
  HIGH_ACCURACY: { id:'high_accuracy', name:'Sharp Ears',    icon:'👂', condition:'90%+ score x5' },
  HANDWRITER:    { id:'handwriter',    name:'Handwriter',    icon:'✍️', condition:'5 handwrite sessions' },
};
export const BADGE_LIST = Object.values(BADGES);
export const getBadgeById = (id) => BADGE_LIST.find(b => b.id === id) || { id, name:id, icon:'🏅' };
