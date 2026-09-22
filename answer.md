# ProcessDesk — Answer Key

**Instructor only. Do not distribute.**

All paths and line numbers refer to the **student** package (`processdesk-student/`) as shipped, before any contestant edits or refactors. The student code carries neutral explanatory comments around each bug site (they describe expected behavior and never mention a defect); the same comments exist in the instructor package. The fully fixed code is in `processdesk-instructor/`. Contestants may restructure the code with Claude, so mark by *behavior*, not by matching these locations.

| # | Tier | Marks | File | Line(s) |
|---|---|---|---|---|
| 1 | Very easy | 1 | `src/components/toolbar/ProcessToolbar.jsx` | 12 |
| 2 | Very easy | 1 | `src/components/toolbar/ProcessToolbar.jsx` | 22 |
| 3 | Very easy | 1 | `src/services/processApi.js` | 9 |
| 4 | Very easy | 1 | `src/features/processes/useProcessStore.js` | 37 |
| 5 | Easy | 1 | `src/utils/sortState.js` | 4 |
| 6 | Easy | 1 | `src/components/processes/ProcessRow.jsx` | 18 (+ import) |
| 7 | Easy | 1 | `electron/services/systemService.js` | 13 |
| 8 | Easy | 1 | `src/services/processApi.js` | 7 |
| 9 | Easy | 1 | `src/features/processes/useProcessStore.js` | 43 |
| 10 | Easy | 1 | `src/features/processes/useSelectedProcess.js` | 9 |

Total: **10 marks** (4 Very easy + 6 Easy — no Medium or Hard tier).

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

## Bug 3 — Force kill uses the graceful path (Very easy)

**File:** `src/services/processApi.js`, line 9

**Symptom:** **Force kill** behaves exactly like **End process**: it sends `SIGTERM` (channel `processes:kill`), so processes that ignore `SIGTERM` survive.

**Root cause:** the `forceKill` adapter calls `killProcess` instead of `forceKillProcess` — a wrong function name, nothing more.

**What to change:**

```js
// Before (line 9)
forceKill: (pid) => getBridge().killProcess(pid),

// After
forceKill: (pid) => getBridge().forceKillProcess(pid),
```

**Signal:** Force kill goes through `processes:force-kill` (visible in the main-process log if a handler log is added) and terminates processes that ignore `SIGTERM`.

---

## Bug 4 — Pause does the opposite of what it should (Very easy)

**File:** `src/features/processes/useProcessStore.js`, line 37 (the `tick` callback)

**Symptom:** The list never auto-loads while running normally; clicking **Pause** triggers an immediate fetch instead of stopping updates, and clicking **Resume** does nothing.

**Root cause:** the condition in `tick` is backwards — it only refreshes *while paused* instead of *while not paused*.

**What to change:** flip the condition.

```js
// Before (line 37)
const tick = useCallback(() => {
  if (paused) refresh();
}, [paused, refresh]);

// After
const tick = useCallback(() => {
  if (!paused) refresh();
}, [paused, refresh]);
```

**Signal:** on load the list populates and keeps updating every 2 seconds; clicking Pause freezes it; clicking Resume starts it updating again right away.

---

## Bug 5 — Sorted column never reverses (Easy)

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

## Bug 6 — Memory column is ~1024× too small (Easy)

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

## Bug 7 — Memory card shows available/total (Easy)

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

## Bug 8 — End process reports "Invalid PID" (Easy)

**File:** `src/services/processApi.js`, line 7

**Symptom:** Clicking **End process** and confirming shows `Unable to end process: … Invalid PID`.

**Root cause:** the renderer adapter wraps the PID in an object `{ pid }` before sending it, but the preload bridge and main-process validator (`assertPid` in `electron/validators/processValidator.js`) expect the bare numeric PID itself. (`docs/IPC_FLOW.md` and `docs/DATA_CONTRACTS.md` state the payload is the PID itself.) The fix is in the renderer adapter, not by loosening the validator.

**What to change:**

```js
// Before (line 7)
kill: (pid) => getBridge().killProcess({ pid }),

// After
kill: (pid) => getBridge().killProcess(pid),
```

**Signal:** End process terminates the selected PID with no "Invalid PID" error.

---

## Bug 9 — Auto-refresh happens far slower than every 2 seconds (Easy)

**File:** `src/features/processes/useProcessStore.js`, line 43 (the polling `useEffect`)

**Symptom:** The list and its values barely change — they only update roughly every 20 seconds instead of every 2, even though Pause/Resume and manual Refresh still work correctly.

**Root cause:** the timer ignores the `refreshMs` parameter sitting right there and uses a hardcoded `20000` instead.

**What to change:**

```js
// Before (line 43)
useEffect(() => {
  tick();
  const timer = setInterval(tick, 20000);
  return () => clearInterval(timer);
}, [tick, refreshMs]);

// After
useEffect(() => {
  tick();
  const timer = setInterval(tick, refreshMs);
  return () => clearInterval(timer);
}, [tick, refreshMs]);
```

**Signal:** watch the table for a few seconds after load — CPU/memory values visibly update roughly every 2 seconds, not every ~20.

---

## Bug 10 — Inspector never opens when a process is selected (Easy)

**File:** `src/features/processes/useSelectedProcess.js`, line 9

**Symptom:** Clicking a process row in the table never opens the inspector panel.

**Root cause:** the hook already derives the selected process from the latest snapshot by matching on the stored PID, but the lookup compares the wrong field — `p.name` (a string) against `selectedPid` (a number) — so it never finds a match.

**What to change:**

```js
// Before (line 9)
const selected = useMemo(
  () => (selectedPid === null ? null : (snapshot.find((p) => p.name === selectedPid) ?? null)),
  [snapshot, selectedPid],
);

// After
const selected = useMemo(
  () => (selectedPid === null ? null : (snapshot.find((p) => p.pid === selectedPid) ?? null)),
  [snapshot, selectedPid],
);
```

**Signal:** clicking any process row opens the inspector immediately, and its CPU/memory keep updating on each refresh (the hook already re-derives from the latest snapshot, so this also confirms the selection tracks live data and clears when the process exits — see `docs/DEBUGGING_PLAYBOOK.md` for the general re-test-nearby-behavior habit).

---

## Verification checklist

```bash
cd processdesk-student
npm install
npm test                 # passes before AND after fixes
npm run lint:structure   # passes before AND after fixes
npm run dev              # walk through the 10 behaviors in QUESTION_PAPER.md
```

In `processdesk-instructor/`, `npm run test:verify` automatically checks bugs 3, 5, 7 and 8 (it fails on the unfixed student code for exactly these four). Bugs 1, 2, 4, 9 and 10 are UI/state behavior and must be checked in the running app; see `INSTRUCTOR_GUIDE.md` for the manual checks.

## Bonus: things contestants should *not* do

- Loosen `assertPid` to accept objects or strings (fixes bug 8 in the wrong layer).
- Set `nodeIntegration: true` or `contextIsolation: false`, or expose `ipcRenderer` from the preload script.
- Fix bug 4 by removing the Pause feature, or bug 10 by removing the inspector.
- Import `electron`, `fs` or `child_process` in renderer code (`npm run lint:structure` catches this).
