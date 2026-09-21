import { useCallback, useState } from 'react';

// Tracks the process shown in the inspector. Expectation: the inspector always shows the
// latest values of that process, and nothing is selected once the process is gone.
export function useSelectedProcess(snapshot) {
  const [selected, setSelected] = useState(null);

  const select = useCallback((process) => setSelected(process), []);
  const clear = useCallback(() => setSelected(null), []);

  return { selected, select, clear };
}
