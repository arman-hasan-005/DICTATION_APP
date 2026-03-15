export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
};
export const formatRelativeTime = (date) => {
  if (!date) return '';
  const diff  = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24)return `${hours}h ago`;
  if (days < 7)  return `${days}d ago`;
  return formatDate(date);
};
export const formatXP = (xp) => `+${xp} XP`;
export const truncate = (str, max = 50) => !str || str.length <= max ? str : str.slice(0, max).trimEnd() + '…';
export const capitalize = (str) => !str ? '' : str.charAt(0).toUpperCase() + str.slice(1);
