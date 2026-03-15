import styles from './StatsGrid.module.css';
const StatCard = ({ icon, value, label, color }) => (
  <div className={styles.card}>
    <div className={styles.icon}>{icon}</div>
    <div className={styles.value} style={color?{color}:undefined}>{value}</div>
    <div className={styles.label}>{label}</div>
  </div>
);
export default function StatsGrid({ user, totalSessions, accuracy }) {
  return (
    <div className={styles.grid}>
      <StatCard icon="⚡" value={user?.xp ?? 0}      label="Total XP"      color="var(--color-warning)" />
      <StatCard icon="🔥" value={user?.streak ?? 0}  label="Day Streak"    color="var(--color-danger)"  />
      <StatCard icon="📝" value={totalSessions}       label="Sessions Done" color="var(--color-primary)" />
      <StatCard icon="🎯" value={`${accuracy}%`}      label="Avg Accuracy"  color="var(--color-success)" />
    </div>
  );
}
