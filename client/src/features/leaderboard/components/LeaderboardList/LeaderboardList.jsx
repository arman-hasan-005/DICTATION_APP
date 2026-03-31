/**
 * LeaderboardList — ranks 4 and below
 *
 * FIX: previously computed rank as i+4 (hardcoded offset).
 * Now reads entry.rank from the server response (which is 1-based and
 * correct even if fewer than 3 users exist).
 *
 * Also shows accuracy alongside the main metric.
 */
import { useAuth }  from '../../../../hooks/useAuth';
import styles       from './LeaderboardList.module.css';

const COLORS  = ['#4F46E5','#059669','#D97706','#DC2626','#0EA5E9'];
const getColor = (name) => COLORS[(name?.charCodeAt(0) ?? 0) % COLORS.length];

export default function LeaderboardList({ entries = [], tab, loading }) {
  const { user } = useAuth();

  if (loading) return <div className={styles.loading}>Loading rankings…</div>;
  if (!entries.length) return null;

  return (
    <div className={styles.list}>
      {entries.map((entry) => {
        const isMe = entry._id?.toString() === user?._id?.toString();
        const value =
          tab === 'xp'       ? `⚡ ${entry.xp ?? 0} XP` :
          tab === 'streak'   ? `🔥 ${entry.streak ?? 0} days` :
                               `📝 ${entry.totalSessions ?? 0} sessions`;

        return (
          <div
            key={entry._id}
            className={[styles.row, isMe ? styles.rowMe : ''].filter(Boolean).join(' ')}
          >
            <div className={styles.rank}>
              <span className={styles.rankNum}>{entry.rank}</span>
            </div>
            <div
              className={styles.avatar}
              style={{ background: getColor(entry.name) }}
            >
              {entry.name?.charAt(0).toUpperCase()}
            </div>
            <div className={styles.info}>
              <p className={styles.name}>
                {entry.name}
                {isMe && <span className={styles.youBadge}>You</span>}
              </p>
              <p className={styles.meta}>
                {entry.totalSessions ?? 0} sessions
                {entry.accuracy != null && ` · ${entry.accuracy}% accuracy`}
              </p>
            </div>
            <div className={styles.value}>{value}</div>
          </div>
        );
      })}
    </div>
  );
}
