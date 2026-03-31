/**
 * useLeaderboard
 *
 * FIX: previously passed [tab] as the second argument to useFetch, but
 * useFetch's second arg is { immediate, deps }, not a raw deps array.
 * [tab] was silently treated as a truthy options object with no effect —
 * switching tabs never triggered a new API call.
 *
 * Fix: pass deps: [tab] correctly. useFetch now re-executes whenever
 * any dep changes.
 *
 * Also reads myRank and myEntry directly from the server response
 * instead of computing them client-side (server now handles out-of-top-50).
 */
import { useState } from 'react';
import { useAuth }  from '../../../hooks/useAuth';
import { useFetch } from '../../../hooks/useFetch';
import leaderboardService from '../../../services/leaderboardService';

export const useLeaderboard = () => {
  const { user }  = useAuth();
  const [tab, setTab] = useState('xp');

  // deps: [tab] — re-fetches whenever the tab changes
  const { data, loading, error, refetch } = useFetch(
    () => leaderboardService.get(tab),
    { deps: [tab] },
  );

  // Server returns { leaderboard, type, myEntry, myRank }
  const entries  = data?.leaderboard ?? [];
  const myRank   = data?.myRank  ?? 0;
  const myEntry  = data?.myEntry ?? null;   // user's row if outside top 50

  return {
    entries,
    top3:    entries.slice(0, 3),
    rest:    entries.slice(3),
    myRank,
    myEntry,
    loading,
    error,
    tab,
    setTab,
    refetch,
  };
};
