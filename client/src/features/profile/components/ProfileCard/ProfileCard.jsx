import { getLevelConfig } from '../../../../constants/levels';
import { getAccentIcon, getGenderLabel, getAccentLabel } from '../../../../constants/voices';
import { formatDate } from '../../../../utils/formatting';
import styles from './ProfileCard.module.css';

export default function ProfileCard({ user, onEdit }) {
  const levelCfg = getLevelConfig(user?.preferredLevel);
  const gender   = user?.preferredVoice  || 'female';
  const accent   = user?.preferredAccent || 'american';
  const voiceLabel = `${getAccentIcon(accent)} ${getGenderLabel(gender)} · ${getAccentLabel(accent)}`;

  return (
    <div className={styles.card}>
      <div className={styles.avatarWrap}>
        <div className={styles.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
        <button className={styles.editBtn} onClick={onEdit}>✏️ Edit Profile</button>
      </div>
      <div className={styles.info}>
        <h2 className={styles.name}>{user?.name}</h2>
        <p className={styles.email}>{user?.email}</p>
        <p className={styles.joined}>Joined {formatDate(user?.createdAt)}</p>
      </div>
      <div className={styles.chips}>
        <span className={styles.levelChip} style={{ background: levelCfg.bgColor, color: levelCfg.color }}>
          {levelCfg.emoji} {levelCfg.label}
        </span>
        <span className={styles.voiceChip}>🎙️ {voiceLabel}</span>
      </div>
      <div className={styles.statsRow}>
        <div className={styles.stat}><span className={styles.statVal}>⚡ {user?.xp ?? 0}</span><span className={styles.statLbl}>Total XP</span></div>
        <div className={styles.stat}><span className={styles.statVal}>🔥 {user?.streak ?? 0}</span><span className={styles.statLbl}>Day Streak</span></div>
        <div className={styles.stat}><span className={styles.statVal}>📝 {user?.totalSessions ?? 0}</span><span className={styles.statLbl}>Sessions</span></div>
      </div>
    </div>
  );
}
