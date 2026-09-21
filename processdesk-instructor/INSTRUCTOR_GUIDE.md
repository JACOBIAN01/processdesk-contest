# ProcessDesk — Instructor Guide

The student package contains exactly 10 seeded regressions. They are intentionally distributed across renderer UI, feature/state logic, API contracts, Electron service logic, and async behavior. This package (`processdesk-instructor`) is the fully working reference: it is the student package with all ten regressions fixed, and it shares every other line of code with it.

| # | Difficulty | Symptom | Root cause | File | Expected fix |
|---|---|---|---|---|---|
| 1 | Very easy | Search field does not accept/filter typed text | `onChange` writes the existing query back into state | `src/components/toolbar/ProcessToolbar.jsx` | Pass `e.target.value` to `setQuery` |
| 2 | Very easy | Refresh changes pause state instead of fetching | Refresh button is wired to `setPaused` | `src/components/toolbar/ProcessToolbar.jsx` | Call `refresh` |
| 3 | Easy | Clicking a sorted column does not reverse direction | Toggle expression returns `'asc'` in both branches | `src/utils/sortState.js` (`nextSort`) | Alternate `asc` / `desc` |
| 4 | Easy | Table memory is roughly 1024× too small | `memoryRss` is KB but `formatBytes` expects bytes; the row skips `kbToBytes` | `src/components/processes/ProcessRow.jsx` | `formatBytes(kbToBytes(process.memoryRss))` (the inspector already does this) |
| 5 | Medium | Pause UI changes, but periodic replacement continues | `tick` closes over the initial `paused=false` because `paused` is missing from its `useCallback` dependencies | `src/features/processes/useProcessStore.js` | Add `paused` to the dependencies (or an equivalent ref-based design) |
| 6 | Medium | End process reports invalid PID | Renderer sends `{pid}` while preload/main expect a bare numeric PID | `src/services/processApi.js` | Send the numeric PID unchanged |
| 7 | Medium | Force kill follows graceful termination path | `forceKill` adapter calls `killProcess` | `src/services/processApi.js` | Call `forceKillProcess` |
| 8 | Medium | Memory percentage represents available memory | `buildMemorySummary` computes `available / total` | `electron/services/systemService.js` | Compute `used / total` |
| 9 | Hard | Under overlapping refreshes, stale data can replace newer data | The request counter is incremented but never compared, so any response commits | `src/features/processes/useProcessStore.js` (`refresh`) | Commit only when the response's id is still the latest |
| 10 | Hard | Inspector keeps old values / dead selection | `useSelectedProcess` stores a copy of the row object and never reconciles it after a refresh | `src/features/processes/useSelectedProcess.js` | Store the PID; resolve it against the latest snapshot; clear if absent |

## Suggested marking
- Very easy: 0.5 × 2 = 1 mark
- Easy: 1 × 2 = 2 marks
- Medium: 1.25 × 4 = 5 marks
- Hard: 1 × 2 = 2 marks
- **Total: 10 marks**

Award the mark only when behavior works and the fix preserves the security boundary between renderer and main process. Because contestants may refactor freely with Claude, mark by behavior and boundary, not by matching the file locations above.

## Automated verification
This package includes tests that the student package deliberately omits:

```bash
npm test               # unit + integration (also present in the student package; must pass on both)
npm run test:verify    # bug-specific checks: #3 sort toggle, #6/#7 processApi, #8 memory percent
```

`test:verify` is written against the original module paths. If a contestant moved or renamed those modules, check behavior manually instead. Bugs 1, 2, 4, 5, 9 and 10 are UI/state behavior and are verified by running the app:

| # | Manual check |
|---|---|
| 1 | Type `node` in the search box; the list filters as you type; `NODE` behaves the same |
| 2 | Click Pause, then Refresh; a fresh snapshot loads and the button still says Resume |
| 4 | Compare a row's memory with Activity Monitor / Task Manager; values are in a realistic range |
| 5 | Click Pause; the process count and values stop changing; Resume restarts them immediately |
| 9 | Click Refresh rapidly while throttling IPC (add a random delay in `processService.listProcesses`); the list never regresses to older data |
| 10 | Select a process, watch its CPU update in the inspector; end that process from a terminal and confirm the inspector closes |

## Differences between the two packages
The student package differs from this one only at the ten bug sites above, plus the absence of `INSTRUCTOR_GUIDE.md`, `tests/verify/`, and the `test:verify` script. To re-seed or audit, diff the two directories.

## Behavior notes (post-refactor)
- Manual Refresh now fetches even while paused; only the automatic timer honours pause.
- Selection is by PID and resolved against the raw snapshot, so filtering the table does not clear the inspector.
- Process rows are capped at 200 after sorting by CPU, so the busiest processes are never dropped.
