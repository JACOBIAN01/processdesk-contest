import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { processApi } from '../../services/processApi.js';
import { DEFAULT_SORT, UI } from '../../constants/ui.js';
import { filterProcesses, sortProcesses } from '../../utils/processFilter.js';
import { nextSort } from '../../utils/sortState.js';

// Owns the process list state: raw snapshot, search query, sort order, pause flag and
// loading/error status. Filtering and sorting are derived from the snapshot.
export function useProcessStore(refreshMs = UI.PROCESS_REFRESH_MS) {
  const [snapshot, setSnapshot] = useState([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const latestRequestId = useRef(0);

  // Fetches a fresh process snapshot and stores it. Called by the timer, the Refresh button
  // and after a kill. Expectation: the stored snapshot always reflects the newest request.
  const refresh = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    const isLatest = () => requestId === latestRequestId.current;
    try {
      const rows = await processApi.list();
      if (!isLatest()) return;
      setSnapshot(rows);
      setError('');
    } catch (err) {
      if (isLatest()) setError(err.message);
    } finally {
      if (isLatest()) setLoading(false);
    }
  }, []);

  // Timer callback for automatic polling. While the app is running (not paused), each
  // tick should fetch a fresh snapshot; while paused, ticks should be a no-op so the
  // list stays exactly as it was.
  const tick = useCallback(() => {
    if (paused) refresh();
  }, [paused, refresh]);

  // Polling loop: should fetch immediately on mount, then again every `refreshMs`
  // milliseconds for as long as the app stays open, so the list stays close to real
  // time without the user doing anything.
  useEffect(() => {
    tick();
    const timer = setInterval(tick, 20000);
    return () => clearInterval(timer);
  }, [tick, refreshMs]);

  const items = useMemo(
    () => sortProcesses(filterProcesses(snapshot, query), sort),
    [snapshot, query, sort],
  );

  const toggleSort = useCallback((key) => setSort((prev) => nextSort(prev, key)), []);

  // Terminates a process (gracefully, or forcefully when `force` is set), then reloads the list.
  const kill = useCallback(
    async (pid, force = false) => {
      await (force ? processApi.forceKill(pid) : processApi.kill(pid));
      await refresh();
    },
    [refresh],
  );

  return {
    items,
    snapshot,
    query,
    setQuery,
    sort,
    toggleSort,
    paused,
    setPaused,
    loading,
    error,
    refresh,
    kill,
    total: snapshot.length,
  };
}
