import { useAuth } from '../../../../hooks/useAuth';
import styles from './LeaderboardList.module.css';
const COLORS = ['#4F46E5','#059669','#D97706','#DC2626','#0EA5E9'];
const getColor = (name) => COLORS[(name?.charCodeAt(0)||0) % COLORS.length];
const MEDALS = {1:'🥇',2:'🥈',3:'🥉'};

export default function LeaderboardList({ entries = [], tab, loading }) {
  const { user } = useAuth();
  if (loading) return <div className={styles.loading}>Loading rankings…</div>;
  if (!entries.length) return <div className={styles.empty}>No data yet. Be the first!</div>;
  return (
    <div className={styles.list}>
      {entries.map((entry, i) => {
        const rank  = i + 4; // rest starts at rank 4
        const isMe  = entry._id === user?._id;
        const value = tab==='xp' ? `⚡ ${entry.xp} XP` : tab==='streak' ? `🔥 ${entry.streak} days` : `📝 ${entry.totalSessions} sessions`;
        return (
          <div key={entry._id} className={[styles.row, isMe?styles.rowMe:''].filter(Boolean).join(' ')}>
            <div className={styles.rank}><span className={styles.rankNum}>{rank}</span></div>
            <div className={styles.avatar} style={{ background: getColor(entry.name) }}>{entry.name?.charAt(0).toUpperCase()}</div>
            <div className={styles.info}>
              <p className={styles.name}>{entry.name}{isMe && <span className={styles.youBadge}>You</span>}</p>
              <p className={styles.meta}>{entry.totalSessions||0} sessions</p>
            </div>
            <div className={styles.value}>{value}</div>
          </div>
        );
      })}
    </div>
  );
}
