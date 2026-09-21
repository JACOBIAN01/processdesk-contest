import { useEffect, useState } from 'react';
import { systemApi } from '../../services/systemApi.js';
import { UI } from '../../constants/ui.js';

export function useSystemSummary(refreshMs = UI.SYSTEM_REFRESH_MS) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;

    async function load() {
      try {
        const summary = await systemApi.summary();
        if (!live) return;
        setData(summary);
        setError('');
      } catch (err) {
        if (live) setError(err.message);
      }
    }

    load();
    const timer = setInterval(load, refreshMs);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [refreshMs]);

  return { data, error };
}
