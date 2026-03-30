/* import styles from './StreakCard.module.css';
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
 */

import styles from "./StreakCard.module.css";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export default function StreakCard({
  streak = 0,
  longestStreak = 0,
  activeWeekDays = [],
}) {
  // Highlight today's dot differently so user knows where they are
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1; // convert to Mon=0 index

  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <div className={styles.flame}>🔥</div>
        <div>
          <div className={styles.num}>{streak}</div>
          <div className={styles.lbl}>day streak</div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.week}>
          {DAY_LABELS.map((d, i) => {
            const isActive = activeWeekDays.includes(i);
            const isToday = i === todayIdx;
            return (
              <div key={i} className={styles.dayCol}>
                <div
                  className={[
                    styles.dot,
                    isActive ? styles.dotActive : "",
                    isToday ? styles.dotToday : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  title={isActive ? "Practiced" : isToday ? "Today" : ""}
                />
                <span
                  className={[styles.dayLbl, isToday ? styles.dayLblToday : ""]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {d}
                </span>
              </div>
            );
          })}
        </div>
        <p className={styles.best}>Best: {longestStreak} days</p>
      </div>
    </div>
  );
}
