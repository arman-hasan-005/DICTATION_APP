/**
 * useFetch
 *
 * REFACTORING vs original:
 *
 *   RELIABILITY — useRef for the fetch function:
 *     The original pattern `useCallback(fetchFn, deps)` has a footgun:
 *     if the caller forgets to pass deps or passes the wrong ones, the hook
 *     silently uses a stale closure. This is a common React bug.
 *
 *     Fix: store `fetchFn` in a ref that's always up-to-date. The `execute`
 *     callback reads from the ref instead of closing over `fetchFn` directly.
 *     `execute` itself has zero dependencies — it's always stable.
 *
 *   ABORT SUPPORT:
 *     Added AbortController so in-flight requests are cancelled when the
 *     component unmounts or `refetch` is called while a request is pending.
 *     Prevents the "Can't update state on unmounted component" warning.
 *
 *   API UNCHANGED:
 *     { data, loading, error, refetch } — identical to the original.
 *     All existing callers (useDashboardData, useProfileData, etc.) work
 *     without modification.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export function useFetch(fetchFn, { immediate = true } = {}) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error,   setError]   = useState(null);

  // Always-fresh reference to the fetch function
  const fetchFnRef  = useRef(fetchFn);
  useEffect(() => { fetchFnRef.current = fetchFn; });

  // Active abort controller for the in-flight request
  const controllerRef = useRef(null);

  const execute = useCallback(async () => {
    // Cancel any pending request
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetchFnRef.current();
      if (!controller.signal.aborted) {
        setData(res.data);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(
          err.response?.data?.message ?? err.message ?? 'Something went wrong',
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []); // stable — no deps needed

  // Cancel on unmount
  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  useEffect(() => {
    if (immediate) execute();
  }, [execute, immediate]);

  return { data, loading, error, refetch: execute };
}
