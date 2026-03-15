import { getBadgeById } from '../../../../constants/badges';
import styles from './BadgeUnlock.module.css';

export default function BadgeUnlock({ newBadges = [] }) {
  if (!newBadges.length) return null;
  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>🏆 New Badges Unlocked!</h3>
      <div className={styles.list}>
        {newBadges.map((badge, i) => {
          const def = getBadgeById(badge.id || badge);
          return (
            <div key={i} className={styles.badge}>
              <div className={styles.icon}>{def.icon}</div>
              <div><p className={styles.name}>{def.name}</p><p className={styles.condition}>{def.condition}</p></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
