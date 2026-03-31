/**
 * Podium — top 3 display
 *
 * FIX: uses entry.rank from server (not hardcoded [2,1,3] positions)
 * and shows accuracy in the value line.
 */
import { useAuth } from '../../../../hooks/useAuth';
import styles from './Podium.module.css';

const COLORS  = ['#4F46E5','#059669','#D97706','#DC2626','#0EA5E9'];
const getColor = (name) => COLORS[(name?.charCodeAt(0) ?? 0) % COLORS.length];

export default function Podium({ top3 = [], tab }) {
  const { user } = useAuth();
  if (top3.length < 1) return null;

  // Display order: 2nd place (left), 1st place (centre), 3rd place (right)
  const order  = [top3[1], top3[0], top3[2]].filter(Boolean);
  const medals  = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const heights = { 1: '80px', 2: '60px', 3: '50px' };
  const bgColors= { 1: '#F59E0B', 2: '#94A3B8', 3: '#F97316' };

  const getValue = (e) =>
    tab === 'xp'     ? `⚡ ${e.xp ?? 0} XP` :
    tab === 'streak' ? `🔥 ${e.streak ?? 0} days` :
                       `📝 ${e.totalSessions ?? 0}`;

  return (
    <div className={styles.podium}>
      {order.map((entry) => {
        const rank  = entry.rank;
        const isMe  = entry._id?.toString() === user?._id?.toString();
        return (
          <div
            key={entry._id}
            className={[styles.podiumItem, rank === 1 ? styles.first : '']
              .filter(Boolean).join(' ')}
          >
            {rank === 1 && <div className={styles.crown}>👑</div>}
            <div className={styles.medal}>{medals[rank] ?? rank}</div>
            <div
              className={[styles.avatar, isMe ? styles.avatarMe : ''].filter(Boolean).join(' ')}
              style={{ background: getColor(entry.name) }}
            >
              {entry.name?.charAt(0).toUpperCase()}
            </div>
            <p className={styles.name}>
              {entry.name?.split(' ')[0]}
              {isMe && <span className={styles.youTag}> (you)</span>}
            </p>
            <p className={styles.value}>{getValue(entry)}</p>
            {entry.accuracy != null && (
              <p className={styles.accuracy}>{entry.accuracy}% acc</p>
            )}
            <div
              className={styles.block}
              style={{ height: heights[rank] ?? '50px', background: bgColors[rank] ?? '#94A3B8' }}
            >
              #{rank}
            </div>
          </div>
        );
      })}
    </div>
  );
}
