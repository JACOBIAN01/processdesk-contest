# ProcessDesk — Instructor Guide

The student package contains exactly 10 seeded regressions. They are intentionally distributed across renderer UI, feature/state logic, API contracts, and Electron service logic, and are all beginner/easy level — no async race conditions, stale closures, or multi-layer contract tracing required. This package (`processdesk-instructor`) is the fully working reference: it is the student package with all ten regressions fixed, and it shares every other line of code with it.

| # | Difficulty | Symptom | Root cause | File | Expected fix |
|---|---|---|---|---|---|
| 1 | Very easy | Search field does not accept/filter typed text | `onChange` writes the existing query back into state | `src/components/toolbar/ProcessToolbar.jsx` | Pass `e.target.value` to `setQuery` |
| 2 | Very easy | Refresh changes pause state instead of fetching | Refresh button is wired to `setPaused` | `src/components/toolbar/ProcessToolbar.jsx` | Call `refresh` |
| 3 | Very easy | Force kill follows the graceful termination path | `forceKill` adapter calls `killProcess` instead of `forceKillProcess` | `src/services/processApi.js` | Call `forceKillProcess` |
| 4 | Very easy | Pause behaves backwards — list never auto-loads while running, Pause triggers a fetch instead of stopping | `tick`'s condition is inverted (`if (paused) refresh()`) | `src/features/processes/useProcessStore.js` | Flip to `if (!paused) refresh()` |
| 5 | Easy | Clicking a sorted column does not reverse direction | Toggle expression returns `'asc'` in both branches | `src/utils/sortState.js` (`nextSort`) | Alternate `asc` / `desc` |
| 6 | Easy | Table memory is roughly 1024× too small | `memoryRss` is KB but `formatBytes` expects bytes; the row skips `kbToBytes` | `src/components/processes/ProcessRow.jsx` | `formatBytes(kbToBytes(process.memoryRss))` (the inspector already does this) |
| 7 | Easy | Memory percentage represents available memory | `buildMemorySummary` computes `available / total` | `electron/services/systemService.js` | Compute `used / total` |
| 8 | Easy | End process reports invalid PID | Renderer sends `{pid}` while preload/main expect a bare numeric PID | `src/services/processApi.js` | Send the numeric PID unchanged |
| 9 | Easy | Auto-refresh happens roughly every 20 seconds instead of every 2 | Polling timer hardcodes `20000` instead of using the `refreshMs` parameter | `src/features/processes/useProcessStore.js` | Use `refreshMs` |
| 10 | Easy | Inspector never opens when a process is selected | Selected-process lookup compares `p.name` instead of `p.pid` against the stored PID | `src/features/processes/useSelectedProcess.js` | Compare `p.pid` |

## Suggested marking
- Very easy: 1 × 4 = 4 marks
- Easy: 1 × 6 = 6 marks
- **Total: 10 marks**

Award the mark only when behavior works and the fix preserves the security boundary between renderer and main process. Because contestants may refactor freely with Claude, mark by behavior and boundary, not by matching the file locations above.

## Automated verification
This package includes tests that the student package deliberately omits:

```bash
npm test               # unit + integration (also present in the student package; must pass on both)
npm run test:verify    # bug-specific checks: #5 sort toggle, #3/#8 processApi, #7 memory percent
```

`test:verify` is written against the original module paths. If a contestant moved or renamed those modules, check behavior manually instead. Bugs 1, 2, 4, 6, 9 and 10 are UI/state behavior and are verified by running the app:

| # | Manual check |
|---|---|
| 1 | Type `node` in the search box; the list filters as you type; `NODE` behaves the same |
| 2 | Click Pause, then Refresh; a fresh snapshot loads and the button still says Resume |
| 4 | Load the app; the list populates and keeps updating every ~2 seconds; click Pause — it freezes; click Resume — it updates immediately |
| 6 | Compare a row's memory with Activity Monitor / Task Manager; values are in a realistic range |
| 9 | Watch the table for a few seconds after load; values should visibly update roughly every 2 seconds, not roughly every 20 |
| 10 | Click a process row; the inspector opens immediately with live values that keep updating on each refresh |

## Differences between the two packages
The student package differs from this one only at the ten bug sites above, plus the absence of `INSTRUCTOR_GUIDE.md`, `tests/verify/`, and the `test:verify` script. To re-seed or audit, diff the two directories.

## Behavior notes (post-refactor)
- Manual Refresh now fetches even while paused; only the automatic timer honours pause.
- Selection is by PID and resolved against the raw snapshot, so filtering the table does not clear the inspector.
- Process rows are capped at 200 after sorting by CPU, so the busiest processes are never dropped.
