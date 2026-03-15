import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import Podium from "../components/Podium/Podium";
import LeaderboardList from "../components/LeaderboardList/LeaderboardList";
import { useLeaderboard } from "../hooks/useLeaderboard";
import styles from "./LeaderboardPage.module.css";

const TABS = [
  { key: "xp", label: "⚡ XP" },
  { key: "streak", label: "🔥 Streak" },
  { key: "sessions", label: "📝 Sessions" },
];

export default function LeaderboardPage() {
  const { top3, rest, myRank, loading, error, tab, setTab } = useLeaderboard();
  return (
    <PageWrapper>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Leaderboard</h1>
          <p className={styles.subtitle}>
            See how you rank against other learners
          </p>
        </div>
        {myRank > 0 && (
          <div className={styles.myRank}>
            Your Rank <strong>#{myRank}</strong>
          </div>
        )}
      </div>
      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={[styles.tab, tab === t.key ? styles.tabActive : ""]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {error && <p className={styles.error}>Could not load leaderboard.</p>}
      <Podium top3={top3} tab={tab} />
      <LeaderboardList entries={rest} tab={tab} loading={loading} />
    </PageWrapper>
  );
}
