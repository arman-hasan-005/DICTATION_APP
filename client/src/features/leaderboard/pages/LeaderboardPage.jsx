/**
 * LeaderboardPage
 *
 * FIX: shows the current user's "Your Position" card when they fall
 * outside the visible top-50 list. Previously myRank was 0 in this case
 * and nothing was shown.
 */
import PageWrapper      from '../../../components/layout/PageWrapper/PageWrapper';
import Podium           from '../components/Podium/Podium';
import LeaderboardList  from '../components/LeaderboardList/LeaderboardList';
import { useLeaderboard } from '../hooks/useLeaderboard';
import styles           from './LeaderboardPage.module.css';

const TABS = [
  { key: 'xp',       label: '⚡ XP'       },
  { key: 'streak',   label: '🔥 Streak'   },
  { key: 'sessions', label: '📝 Sessions'  },
];

export default function LeaderboardPage() {
  const { top3, rest, myRank, myEntry, loading, error, tab, setTab } = useLeaderboard();

  return (
    <PageWrapper>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Leaderboard</h1>
          <p className={styles.subtitle}>See how you rank against other learners</p>
        </div>
        {myRank > 0 && (
          <div className={styles.myRank}>
            Your Rank&nbsp;<strong>#{myRank}</strong>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            className={[styles.tab, tab === t.key ? styles.tabActive : '']
              .filter(Boolean).join(' ')}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className={styles.error}>Could not load leaderboard.</p>}

      <Podium top3={top3} tab={tab} />

      <LeaderboardList entries={rest} tab={tab} loading={loading} />

      {/* Show user's own row when they are outside the top 50 */}
      {myEntry && (
        <div className={styles.myEntryBanner}>
          <span className={styles.myEntryLabel}>Your position</span>
          <span className={styles.myEntryRank}>#{myEntry.rank}</span>
          <span className={styles.myEntryName}>{myEntry.name}</span>
          <span className={styles.myEntryValue}>
            {tab === 'xp'       ? `⚡ ${myEntry.xp} XP`
           : tab === 'streak'   ? `🔥 ${myEntry.streak} days`
           :                      `📝 ${myEntry.totalSessions} sessions`}
          </span>
        </div>
      )}
    </PageWrapper>
  );
}
