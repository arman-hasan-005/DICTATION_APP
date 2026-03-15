import { useNavigate } from "react-router-dom";
import PageWrapper from "../../../components/layout/PageWrapper/PageWrapper";
import StatsGrid from "../components/StatsGrid/StatsGrid";
import RecentSessions from "../components/RecentSessions/RecentSessions";
import StreakCard from "../components/StreakCard/StreakCard";
import Button from "../../../components/ui/Button/Button";
import Loader from "../../../components/ui/Loader/Loader";
import { useDashboardData } from "../hooks/useDashboardData";
import { ROUTES } from "../../../constants/routes";
import styles from "./DashboardPage.module.css";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, recentSessions, totalSessions, accuracy, loading } =
    useDashboardData();
  if (loading) return <Loader fullPage text="Loading dashboard…" />;
  return (
    <PageWrapper>
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>
            Hello, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className={styles.subtitle}>Ready for today&apos;s practice?</p>
        </div>
        <Button onClick={() => navigate(ROUTES.SETUP)} size="lg">
          🎧 Start Practice
        </Button>
      </div>
      <StreakCard
        streak={user?.streak ?? 0}
        longestStreak={user?.longestStreak ?? 0}
      />
      <StatsGrid
        user={user}
        totalSessions={totalSessions}
        accuracy={accuracy}
      />
      <RecentSessions sessions={recentSessions} loading={false} />
    </PageWrapper>
  );
}
