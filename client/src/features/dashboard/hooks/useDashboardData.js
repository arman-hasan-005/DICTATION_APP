/**
 * useDashboardData
 *
 * ACCURACY BUG FIX — two causes:
 *
 * 1. Race condition: the Dashboard's "🏠 Dashboard" button on ResultsPage
 *    was not disabled while the session was being saved. A user could
 *    navigate before `updateUser(updatedUser)` was called, so the AuthContext
 *    user still had the old totalWords/totalCorrectWords, showing the old
 *    accuracy on the dashboard.
 *
 * 2. Stale AuthContext data: even when save completed before navigation,
 *    `useDashboardData` read accuracy from the in-memory AuthContext user
 *    rather than the database. Any mismatch between the in-memory patch and
 *    the real DB values (e.g. concurrent sessions, page refresh mid-save)
 *    would show wrong data.
 *
 * Fix: fetch a fresh /api/auth/me on every dashboard mount. This guarantees
 * accuracy and all stats always reflect what is actually in the database,
 * regardless of the save timing or AuthContext state. The AuthContext user
 * is also updated so other components (navbar XP chip, etc.) stay in sync.
 */

import { useEffect } from 'react';
import { useAuth }   from '../../../hooks/useAuth';
import { useFetch }  from '../../../hooks/useFetch';
import authService   from '../../../services/authService';
import sessionService from '../../../services/sessionService';

export const useDashboardData = () => {
  const { user, updateUser } = useAuth();

  // Always fetch fresh user stats from the DB on mount
  const { data: freshUser, loading: userLoading } =
    useFetch(() => authService.getMe());

  // Sync the fresh user data into AuthContext so navbar XP chip stays current
  useEffect(() => {
    if (freshUser) updateUser(freshUser);
  }, [freshUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch 5 most recent sessions for the history widget
  const { data: sessionsData, loading: sessionsLoading } =
    useFetch(() => sessionService.getAll({ page: 1, limit: 5 }));

  const recentSessions = sessionsData?.sessions ?? [];

  // Use freshUser if available, fall back to AuthContext user during loading
  const statsUser = freshUser ?? user;

  const accuracy = statsUser?.totalWords > 0
    ? Math.round((statsUser.totalCorrectWords / statsUser.totalWords) * 100)
    : 0;

  return {
    user:          statsUser,
    recentSessions,
    totalSessions: statsUser?.totalSessions ?? 0,
    accuracy,
    loading:       userLoading || sessionsLoading,
  };
};
