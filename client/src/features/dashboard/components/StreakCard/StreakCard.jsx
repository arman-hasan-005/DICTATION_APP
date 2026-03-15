import styles from './StreakCard.module.css';
export default function StreakCard({ streak=0, longestStreak=0 }) {
  const days = ['M','T','W','T','F','S','S'];
  const active = Math.min(streak % 7, 7);
  return (
    <div className={styles.card}>
      <div className={styles.left}><div className={styles.flame}>🔥</div><div><div className={styles.num}>{streak}</div><div className={styles.lbl}>day streak</div></div></div>
      <div className={styles.right}>
        <div className={styles.week}>{days.map((d,i) => (<div key={i} className={styles.dayCol}><div className={[styles.dot,i<active?styles.dotActive:''].filter(Boolean).join(' ')} /><span className={styles.dayLbl}>{d}</span></div>))}</div>
        <p className={styles.best}>Best: {longestStreak} days</p>
      </div>
    </div>
  );
}
