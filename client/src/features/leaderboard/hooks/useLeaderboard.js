import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useFetch } from '../../../hooks/useFetch';
import leaderboardService from '../../../services/leaderboardService';

export const useLeaderboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('xp');
  const { data, loading, error, refetch } = useFetch(() => leaderboardService.get(tab), [tab]);
  const entries = data?.leaderboard || data || [];
  const myRank  = entries.findIndex(e => e._id === user?._id) + 1;
  return { entries, top3: entries.slice(0,3), rest: entries.slice(3), myRank, loading, error, tab, setTab, refetch };
};
