import { useCallback, useEffect, useMemo, useState } from 'react';

// Tracks the process shown in the inspector. Expectation: the inspector always shows the
// latest values of that process, and nothing is selected once the process is gone.
export function useSelectedProcess(snapshot) {
  const [selectedPid, setSelectedPid] = useState(null);

  const selected = useMemo(
    () => (selectedPid === null ? null : (snapshot.find((p) => p.pid === selectedPid) ?? null)),
    [snapshot, selectedPid],
  );

  useEffect(() => {
    if (selectedPid !== null && selected === null) setSelectedPid(null);
  }, [selectedPid, selected]);

  const select = useCallback((process) => setSelectedPid(process.pid), []);
  const clear = useCallback(() => setSelectedPid(null), []);

  return { selected, select, clear };
}
