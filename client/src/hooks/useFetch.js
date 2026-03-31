import { useState, useEffect, useCallback } from 'react';
export const useFetch = (fetchFn, deps = [], immediate = true) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error,   setError]   = useState(null);
  const execute = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await fetchFn(); setData(res.data); }
    catch (err) { setError(err.response?.data?.message || err.message || 'Something went wrong'); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { if (immediate) execute(); }, [execute]); // eslint-disable-line
  return { data, loading, error, refetch: execute };
};
