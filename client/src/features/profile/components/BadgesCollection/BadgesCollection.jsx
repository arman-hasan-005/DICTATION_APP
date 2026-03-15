import { BADGE_LIST } from '../../../../constants/badges';
import styles from './BadgesCollection.module.css';

export default function BadgesCollection({ earnedBadges = [] }) {
  const earnedIds = earnedBadges.map(b => b.id || b);
  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>🏅 Badge Collection</h3>
      <p className={styles.subtitle}>{earnedIds.length} / {BADGE_LIST.length} earned</p>
      <div className={styles.grid}>
        {BADGE_LIST.map(badge => {
          const earned = earnedIds.includes(badge.id);
          return (
            <div key={badge.id} className={[styles.badge, earned?styles.earned:styles.locked].join(' ')}>
              <div className={styles.icon}>{badge.icon}</div>
              <p className={styles.name}>{badge.name}</p>
              <p className={styles.condition}>{badge.condition}</p>
              {earned && <span className={styles.check}>✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
