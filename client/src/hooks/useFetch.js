/**
 * useFetch — data fetching hook
 *
 * API:
 *   useFetch(fetchFn, { immediate, deps })
 *
 *   fetchFn   — function that returns a Promise<AxiosResponse>
 *   immediate — run on mount (default true)
 *   deps      — optional array; when any value changes, re-executes the fetch
 *               (mirrors useEffect deps semantics)
 *
 * FIX: the previous version accepted only { immediate } as options and had
 * no way to re-trigger a fetch when closure dependencies changed.
 * Callers like useLeaderboard were passing [tab] as the second argument —
 * interpreted as an object, it was silently ignored, so switching leaderboard
 * tabs never loaded new data.
 *
 * The fix adds a `deps` option. When any dep changes, execute() is called.
 * The fetchFnRef pattern is kept so stale-closure bugs are impossible:
 * execute() always uses the latest version of fetchFn.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export function useFetch(fetchFn, { immediate = true, deps = [] } = {}) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error,   setError]   = useState(null);

  // Always-fresh reference to fetchFn — no stale closures possible
  const fetchFnRef    = useRef(fetchFn);
  const controllerRef = useRef(null);

  useEffect(() => { fetchFnRef.current = fetchFn; });

  const execute = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetchFnRef.current();
      if (!controller.signal.aborted) setData(res.data);
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err.response?.data?.message ?? err.message ?? 'Something went wrong');
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []); // stable — intentionally no deps

  // Cancel on unmount
  useEffect(() => () => controllerRef.current?.abort(), []);

  // Run on mount when immediate=true
  useEffect(() => {
    if (immediate) execute();
  }, [execute, immediate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-run whenever any dep changes (after initial mount)
  const isFirstRun  = useRef(true);
  const prevDepsRef = useRef(deps);

  useEffect(() => {
    // Skip the very first evaluation — the mount effect above handles it
    if (isFirstRun.current) {
      isFirstRun.current = false;
      prevDepsRef.current = deps;
      return;
    }
    // Check if any dep actually changed (shallow equality)
    const changed = deps.some((d, i) => d !== prevDepsRef.current[i]);
    if (changed) {
      prevDepsRef.current = deps;
      execute();
    }
  }); // no deps array — runs after every render to detect dep changes

  return { data, loading, error, refetch: execute };
}
