import { useAuth } from '../../../hooks/useAuth';
import { useFetch } from '../../../hooks/useFetch';
import sessionService from '../../../services/sessionService';

export const useDashboardData = () => {
  const { user } = useAuth();
  const { data: sessions, loading } = useFetch(() => sessionService.getAll());
  const recentSessions = sessions?.slice(0, 5) || [];
  const accuracy = user?.totalWords > 0 ? Math.round((user.totalCorrectWords / user.totalWords) * 100) : 0;
  return { user, recentSessions, totalSessions: user?.totalSessions || 0, accuracy, loading };
};
