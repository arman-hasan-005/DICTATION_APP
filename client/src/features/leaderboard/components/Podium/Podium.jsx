import styles from './Podium.module.css';
const COLORS = ['#4F46E5','#059669','#D97706','#DC2626','#0EA5E9'];
const getColor = (name) => COLORS[(name?.charCodeAt(0)||0) % COLORS.length];

export default function Podium({ top3 = [], tab }) {
  if (top3.length < 1) return null;
  const order   = [top3[1], top3[0], top3[2]].filter(Boolean);
  const medals  = ['🥈','🥇','🥉'];
  const heights = ['60px','80px','50px'];
  const bgColors= ['#94A3B8','#F59E0B','#F97316'];
  const ranks   = [2, 1, 3];

  const getVal = (e) => tab==='xp' ? `⚡ ${e.xp}` : tab==='streak' ? `🔥 ${e.streak} days` : `📝 ${e.totalSessions}`;

  return (
    <div className={styles.podium}>
      {order.map((entry, i) => (
        <div key={entry._id} className={[styles.podiumItem, i===1?styles.first:''].filter(Boolean).join(' ')}>
          {i===1 && <div className={styles.crown}>👑</div>}
          <div className={styles.medal}>{medals[i]}</div>
          <div className={styles.avatar} style={{ background: getColor(entry.name) }}>{entry.name?.charAt(0).toUpperCase()}</div>
          <p className={styles.name}>{entry.name?.split(' ')[0]}</p>
          <p className={styles.value}>{getVal(entry)}</p>
          <div className={styles.block} style={{ height:heights[i], background:bgColors[i] }}>#{ranks[i]}</div>
        </div>
      ))}
    </div>
  );
}
