# ProcessDesk — Answer Key

**Instructor only. Do not distribute.**

All paths and line numbers refer to the **student** package (`processdesk-student/`) as shipped, before any contestant edits or refactors. The student code carries neutral explanatory comments around each bug site (they describe expected behavior and never mention a defect); the same comments exist in the instructor package. The fully fixed code is in `processdesk-instructor/`. Contestants may restructure the code with Claude, so mark by *behavior*, not by matching these locations.

| # | Tier | Marks | File | Line(s) |
|---|---|---|---|---|
| 1 | Very easy | 0.5 | `src/components/toolbar/ProcessToolbar.jsx` | 12 |
| 2 | Very easy | 0.5 | `src/components/toolbar/ProcessToolbar.jsx` | 22 |
| 3 | Easy | 1 | `src/utils/sortState.js` | 4 |
| 4 | Easy | 1 | `src/components/processes/ProcessRow.jsx` | 18 (+ import) |
| 5 | Medium | 1.25 | `src/features/processes/useProcessStore.js` | 34–36 |
| 6 | Medium | 1.25 | `src/services/processApi.js` | 7 |
| 7 | Medium | 1.25 | `src/services/processApi.js` | 9 |
| 8 | Medium | 1.25 | `electron/services/systemService.js` | 13 |
| 9 | Hard | 1 | `src/features/processes/useProcessStore.js` | 18–31 |
| 10 | Hard | 1 | `src/features/processes/useSelectedProcess.js` | 1–12 |

Total: **10 marks**.

---

## Bug 1 — Search box does not filter (Very easy)

**File:** `src/components/toolbar/ProcessToolbar.jsx`, line 12

**Symptom:** Typing in the search box does nothing; the text never changes and the list never filters.

**Root cause:** `onChange` ignores the event and calls `setQuery(query)`, writing the *current* value back into state. The controlled input therefore snaps back on every keystroke.

**What to change:** pass the value typed by the user.

```jsx
// Before (line 12)
onChange={() => setQuery(query)}

// After
onChange={(e) => setQuery(e.target.value)}
```

**Signal:** typing `node` filters the table immediately; `NODE` gives the same result.

---

## Bug 2 — Refresh toggles Pause instead of refreshing (Very easy)

**File:** `src/components/toolbar/ProcessToolbar.jsx`, line 22

**Symptom:** Clicking **Refresh** flips the Pause/Resume button and never fetches a new snapshot.

**Root cause:** the Refresh button's `onClick` was copy-pasted from the Pause button, so it calls `setPaused(!paused)` instead of the `refresh` prop.

**What to change:**

```jsx
// Before (line 22)
<button onClick={() => setPaused(!paused)}>
  <RefreshCw size={16} />
  Refresh
</button>

// After
<button onClick={refresh}>
  <RefreshCw size={16} />
  Refresh
</button>
```

**Signal:** clicking Refresh loads fresh data and the Pause button label does not change (also works while paused).

---

## Bug 3 — Sorted column never reverses (Easy)

**File:** `src/utils/sortState.js`, line 4 (`nextSort`)

**Symptom:** Clicking the header of the column that is already sorted keeps the same direction.

**Root cause:** both branches of the ternary return the same value. `'asc'` stays `'asc'`, and anything else becomes `'desc'`, so the direction can never flip back and forth as intended.

**What to change:**

```js
// Before (line 4)
return { key, direction: prev.direction === 'asc' ? 'asc' : 'desc' };

// After
return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
```

**Signal:** repeated clicks on the sorted column alternate ascending / descending. `npm run test:verify` (instructor package) passes the sort test.

---

## Bug 4 — Memory column is ~1024× too small (Easy)

**File:** `src/components/processes/ProcessRow.jsx`, line 18 (plus the imports at the top)

**Symptom:** A browser that uses ~500 MB shows as ~500 KB in the table. The inspector panel shows the right value.

**Root cause:** `memoryRss` is reported in **kilobytes**, but `formatBytes` expects **bytes**. `ProcessInspector.jsx` already converts with `kbToBytes`; the table row skips the conversion.

**What to change:**

```jsx
// Before — imports (lines 1–2)
import { formatBytes } from '../../utils/formatBytes.js';
import { formatPercent } from '../../utils/formatPercent.js';

// After — add the import
import { formatBytes } from '../../utils/formatBytes.js';
import { formatPercent } from '../../utils/formatPercent.js';
import { kbToBytes } from '../../utils/memory.js';
```

```jsx
// Before (line 18)
<td className="num">{formatBytes(process.memoryRss)}</td>

// After
<td className="num">{formatBytes(kbToBytes(process.memoryRss))}</td>
```

**Signal:** table memory matches the inspector and Activity Monitor / Task Manager.

---

## Bug 5 — Pause does not stop refreshing (Medium)

**File:** `src/features/processes/useProcessStore.js`, lines 34–36 (the `tick` callback)

**Symptom:** The button switches to "Resume", but the list keeps updating every 2 seconds.

**Root cause:** stale closure. `tick` reads `paused`, but the `useCallback` dependency array is `[refresh]`, so `tick` is created once with `paused === false` and never sees later changes. The interval effect depends on `tick`, so it keeps the old function too.

**What to change:** add `paused` to the dependency array. The effect then re-runs when pause changes: on pause the new `tick` is a no-op, and on resume it fetches immediately.

```js
// Before (lines 34–36)
const tick = useCallback(() => {
  if (!paused) refresh();
}, [refresh]);

// After
const tick = useCallback(() => {
  if (!paused) refresh();
}, [paused, refresh]);
```

**Signal:** after Pause the process count and values freeze; after Resume they update again right away.

---

## Bug 6 — End process reports "Invalid PID" (Medium)

**File:** `src/services/processApi.js`, line 7

**Symptom:** Clicking **End process** and confirming shows `Unable to end process: … Invalid PID`.

**Root cause:** contract mismatch across layers. The renderer adapter sends an object `{ pid }`. The preload bridge forwards it unchanged, and `assertPid` in `electron/validators/processValidator.js` requires a bare positive integer, so it rejects the object. (`docs/IPC_FLOW.md` and `docs/DATA_CONTRACTS.md` state that the payload is the PID itself.) The correct fix is in the renderer adapter, not by loosening the validator.

**What to change:**

```js
// Before (line 7)
kill: (pid) => getBridge().killProcess({ pid }),

// After
kill: (pid) => getBridge().killProcess(pid),
```

**Signal:** End process terminates the selected PID with no "Invalid PID" error.

---

## Bug 7 — Force kill uses the graceful path (Medium)

**File:** `src/services/processApi.js`, line 9

**Symptom:** **Force kill** behaves exactly like **End process**: it sends `SIGTERM` (channel `processes:kill`), so processes that ignore `SIGTERM` survive.

**Root cause:** the `forceKill` adapter calls `killProcess` instead of `forceKillProcess`, so the `processes:force-kill` channel and `SIGKILL` are never used.

**What to change:**

```js
// Before (line 9)
forceKill: (pid) => getBridge().killProcess(pid),

// After
forceKill: (pid) => getBridge().forceKillProcess(pid),
```

**Signal:** Force kill goes through `processes:force-kill` (visible in the main-process log if a handler log is added) and terminates processes that ignore `SIGTERM`.

---

## Bug 8 — Memory card shows available/total (Medium)

**File:** `electron/services/systemService.js`, line 13 (`buildMemorySummary`)

**Symptom:** The Memory card percentage is inverted: a machine with 20% of memory used shows about 80%, while the "used / total" text under it is correct.

**Root cause:** `percent` is computed from `mem.available` instead of `mem.used`.

**What to change:**

```js
// Before (line 13)
percent: toPercent(mem.available, mem.total),

// After
percent: toPercent(mem.used, mem.total),
```

**Signal:** the percentage equals `used / total` (e.g. 8 GB used of 32 GB → 25.0%). The sample test in `npm run test:verify` passes.

---

## Bug 9 — Stale response overwrites newer data (Hard)

**File:** `src/features/processes/useProcessStore.js`, lines 18–31 (`refresh`)

**Symptom:** When refreshes overlap (rapid Refresh clicks, a slow IPC call, or the timer firing while a request is in flight), the table occasionally jumps back to older data.

**Root cause:** the request counter `latestRequestId` is incremented but its value is never captured or compared. Every response, including one from an older request that resolves late, calls `setSnapshot`, so out-of-order completion lets stale data win.

**What to change:** capture the id for this request and only commit if it is still the latest. Apply the same guard to the error and loading updates.

```js
// Before (lines 18–31)
// Fetches a fresh process snapshot and stores it. Called by the timer, the Refresh button
// and after a kill. Expectation: the stored snapshot always reflects the newest request.
const refresh = useCallback(async () => {
  latestRequestId.current += 1;
  try {
    const rows = await processApi.list();
    setSnapshot(rows);
    setError('');
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}, []);

// After
// Fetches a fresh process snapshot and stores it. Called by the timer, the Refresh button
// and after a kill. Only the most recent request may commit its result, so a slow older
// response can never overwrite a newer one.
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
```

**Signal:** to reproduce, add a random delay (e.g. `await new Promise(r => setTimeout(r, Math.random() * 3000))`) at the top of `listProcesses` in `electron/services/processService.js`, then click Refresh rapidly. Before the fix the list can regress to older values; after it, only the newest response is ever applied. Remove the delay afterwards.

---

## Bug 10 — Inspector shows stale values / dead process (Hard)

**File:** `src/features/processes/useSelectedProcess.js`, whole file (lines 1–12)

**Symptom:** After selecting a process, the inspector's CPU/memory never update while the process stays in the list. If the process exits, the inspector keeps showing it instead of closing.

**Root cause:** the hook stores a **copy of the row object** taken at click time and never re-resolves it. Its `snapshot` argument is accepted but unused, so new snapshots cannot update the selection or clear it.

**What to change:** store only the PID, derive the selected process from the latest snapshot, and clear the PID when the process is no longer present. `App.jsx` already passes `processes.snapshot` (the unfiltered list, so searching does not clear the selection) and needs no change.

```js
// Before (whole file)
import { useCallback, useState } from 'react';

// Tracks the process shown in the inspector. Expectation: the inspector always shows the
// latest values of that process, and nothing is selected once the process is gone.
export function useSelectedProcess(snapshot) {
  const [selected, setSelected] = useState(null);

  const select = useCallback((process) => setSelected(process), []);
  const clear = useCallback(() => setSelected(null), []);

  return { selected, select, clear };
}

// After
import { useCallback, useEffect, useMemo, useState } from 'react';

// Tracks the process shown in the inspector. Stores only the PID and always resolves it
// against the latest snapshot, so the inspector shows fresh values and clears when the
// process exits.
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
```

**Signal:** select a busy process and watch its CPU/memory change in the inspector on each refresh; quit that process from a terminal and the inspector closes on the next refresh. Typing in the search box so the row is filtered out does **not** close the inspector.

---

## Verification checklist

```bash
cd processdesk-student
npm install
npm test                 # passes before AND after fixes
npm run lint:structure   # passes before AND after fixes
npm run dev              # walk through the 10 behaviors in QUESTION_PAPER.md
```

In `processdesk-instructor/`, `npm run test:verify` automatically checks bugs 3, 6, 7 and 8 (it fails on the unfixed student code for exactly these four). Bugs 1, 2, 4, 5, 9 and 10 are UI/state behavior and must be checked in the running app; see `INSTRUCTOR_GUIDE.md` for the manual checks.

## Bonus: things contestants should *not* do

- Loosen `assertPid` to accept objects or strings (fixes bug 6 in the wrong layer).
- Set `nodeIntegration: true` or `contextIsolation: false`, or expose `ipcRenderer` from the preload script.
- Fix bug 5 by removing the Pause feature, or bug 10 by removing the inspector.
- Import `electron`, `fs` or `child_process` in renderer code (`npm run lint:structure` catches this).
