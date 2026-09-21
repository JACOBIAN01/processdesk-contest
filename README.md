# ProcessDesk — Contest Project Plan

*Internal contest project name for an htop-inspired desktop process monitor built for teaching purposes — not affiliated with or endorsed by the htop project.*

A desktop process monitor ("ProcessDesk") built in Electron + React + Vite, seeded with intentional bugs for an Application Development coding contest. Contestants work in **VS Code**, inspect and debug the codebase, and are **allowed to use Claude (Claude Code / VS Code extension) to refactor the entire codebase and implement the fixes**.

Status: **implemented** — the student package ships with all 10 bugs seeded and the instructor package holds the fixed reference. This document is the locked plan and the shared reference for both.

> **History:** this is the contest sibling of the *VS Code Lite* mid-sem project. It keeps the same concept and theme (a realistic multi-layer Electron codebase with seeded regressions, a tiered bug list, an observable signal per fix, and a written bug report) but swaps the domain from a code editor to a process monitor and the rules from "fix it yourself" to "fix it with AI assistance". The Taught/New lecture split from the mid-sem is dropped because a contest has no lecture syllabus to draw on; tiers are the only axis of difficulty.

---

## 1. Product Concept

**ProcessDesk** is a desktop process monitor. It lists running processes, refreshes them every 2 seconds, lets you search by PID/name/user, sort by any column, pause/resume the live refresh, refresh manually, inspect a selected process, and end or force-kill it. A summary strip shows system memory, disk, and uptime.

**Target users:** contest participants comfortable with VS Code who must read an unfamiliar, larger-than-a-toy codebase, find regressions, and fix them under time pressure.

**Core value:** the repo is deliberately structured like a real product, not a single file, so finding a bug means *tracing* it across layers. Each seeded bug is a realistic regression (a mis-wired handler, a stale closure, a unit mismatch, a contract mismatch) rather than invented syntax.

**Why a layered codebase:** bugs must be reachable only by following data across boundaries.

```text
React UI / feature hooks
        ↓
Renderer service adapters
        ↓ window.processDesk
Preload bridge (contextBridge)
        ↓ IPC invoke/send
Electron IPC handlers
        ↓
Domain services → repositories → systeminformation / Node OS
```

- **Main process** — IPC handlers, domain services, repositories (`systeminformation`), validators, logging, window control
- **Preload** — a single `contextBridge`-exposed `processDesk` API
- **Renderer** — React UI and feature hooks; never touches Node or Electron directly

---

## 2. Feature Breakdown

| # | Feature | Where it lives | Key pieces |
|---|---------|----------------|------------|
| 1 | Process list & auto-refresh (2 s) | `useProcessStore.js`, `processApi.js`, `processService.js` | `setInterval`, `useCallback`, IPC `processes:list` |
| 2 | Search (PID / name / user, case-insensitive) | `ProcessToolbar.jsx`, `processFilter.js` | controlled input, `normalizeText` |
| 3 | Column sorting (default CPU desc, toggle direction) | `sortState.js`, `useProcessStore.js`, `ProcessTable.jsx` | `nextSort` pure helper |
| 4 | Pause / Resume / manual Refresh | `ProcessToolbar.jsx`, `useProcessStore.js` | `paused` state, `refresh` |
| 5 | Process table & memory display | `ProcessRow.jsx`, `formatBytes.js`, `processMapper.js` | KB → bytes unit handling |
| 6 | Process inspector (selection) | `useSelectedProcess.js`, `ProcessInspector.jsx` | selection reconciliation against latest snapshot |
| 7 | End process / Force kill | `processApi.js`, `preload.js`, `processHandlers.js`, `processValidator.js` | `processes:kill`, `processes:force-kill` |
| 8 | System summary (memory / disk / uptime) | `systemService.js`, `SystemCards.jsx` | `systemApi.summary()` |
| 9 | Window chrome & error handling | `windowHandlers.js`, `safeResult.js`, `errors.js` | `window:minimize`, `window:close`, safe IPC results |

Plus shared utils, constants, config, tests (`tests/unit`, `tests/integration`), `scripts/check-structure.js`, and ten docs under `docs/` (~60 source files in total).

---

## 3. Bug Distribution — 10 Bugs, 4 Tiers

| Tier | Bugs | Marks each | Total marks |
|---|---|---|---|
| Very easy | 2 | 0.5 | 1 |
| Easy | 2 | 1 | 2 |
| Medium | 4 | 1.25 | 5 |
| Hard | 2 | 1 | 2 |
| **Total** | **10** | | **10** |

Bugs are spread across renderer UI, feature/state logic, API contracts, Electron service logic, and async behavior, so no single file or layer holds the whole answer.

### Progressive Unlock Design (applies to all tiers)

Every bug has a defined, observable **signal** that fires the moment it is fixed correctly.

| Tier | Pre-fix state (broken) | Signal when fixed |
|---|---|---|
| **Very easy** | Control is dead or does the wrong action | The control responds correctly at once (typing filters, Refresh fetches) |
| **Easy** | Feature runs but visibly shows the wrong thing | Output becomes visibly correct (sort reverses, memory units right) |
| **Medium** | Feature looks right in the UI but fails at a layer boundary or on a hidden condition | The exact repro no longer fails (Pause truly stops updates, End/Force kill hit the right path, memory % is used/total) |
| **Hard** | Failure only appears under timing or state drift | The race or stale-state repro can no longer be produced |

### Which features carry bugs

| Feature | Bugs seeded | Tier(s) |
|---|---|---|
| 1. Process list & auto-refresh | 2 | Medium, Hard |
| 2. Search | 1 | Very easy |
| 3. Column sorting | 1 | Easy |
| 4. Pause / Resume / Refresh | 1 | Very easy |
| 5. Process table & memory display | 1 | Easy |
| 6. Process inspector | 1 | Hard |
| 7. End process / Force kill | 2 | Medium, Medium |
| 8. System summary | 1 | Medium |
| 9. Window chrome & error handling | 0 | — bug-free reference implementation |
| **Total** | **10** | |

Feature 9 is left bug-free on purpose. It is still worth reading: the safe-result and validator patterns there show what a correct IPC contract looks like when tracing bugs 6 and 7.

---

## 4. The 10 Bugs

Function and variable names follow the real code (`processApi`, `useProcessStore`, `nextSort`, `memoryRss`) so the seeded bugs read like real regressions.

### Very easy (2)

1. **Search** — the input's `onChange` calls `setQuery(query)`, writing the existing value back, so typing never changes the filter. File: `src/components/toolbar/ProcessToolbar.jsx`. **Signal:** typing in the box immediately filters by PID, name, or user, case-insensitively.
2. **Refresh** — the Refresh button's `onClick` is wired to `setPaused(!paused)` instead of `refresh`. File: `src/components/toolbar/ProcessToolbar.jsx`. **Signal:** clicking Refresh fetches a fresh snapshot and leaves the Pause state alone.

### Easy (2)

3. **Sorting** — the `nextSort` helper returns `'asc'` in both branches, so clicking the sorted column never reverses. File: `src/utils/sortState.js`. **Signal:** repeated clicks on the sorted column alternate ascending / descending.
4. **Memory units** — `memoryRss` arrives in KB but `formatBytes` expects bytes, so every value is about 1024× too small. File: `src/components/processes/ProcessRow.jsx`. **Signal:** memory values show realistic MB/GB figures that match the OS.

### Medium (4)

5. **Pause** — the polling `tick` callback is memoised without `paused` in its dependencies, so it closes over the initial `paused=false`. The button toggles but polling continues. File: `src/features/processes/useProcessStore.js`. **Signal:** after Pause, the list stops being replaced; after Resume, it restarts.
6. **End process** — the renderer adapter sends `{ pid }` while preload and main expect a bare numeric PID, so validation rejects it as an invalid PID. File: `src/services/processApi.js`. **Signal:** End process terminates the selected PID with no "invalid PID" error.
7. **Force kill** — `forceKill` calls `killProcess` (graceful path) instead of `forceKillProcess`, so both buttons use `processes:kill`. File: `src/services/processApi.js`. **Signal:** Force kill goes through `processes:force-kill`.
8. **Memory card** — the system service computes `percent` from `available / total` instead of `used / total`. File: `electron/services/systemService.js`. **Signal:** the memory card shows used / total.

### Hard (2)

9. **Stale responses** — a request counter is incremented but never compared, so an older, slower response can overwrite a newer snapshot. File: `src/features/processes/useProcessStore.js`. **Signal:** under overlapping refreshes (rapid Refresh clicks, slow IPC), the list can only ever move forward to the latest response.
10. **Inspector staleness** — `useSelectedProcess` stores a copy of the row object and never reconciles it against the refreshed list, so the inspector shows old values or a process that no longer exists. File: `src/features/processes/useSelectedProcess.js`. **Signal:** the inspector shows the latest CPU/memory while the process lives, and the selection clears when it disappears.

---

## 5. Contest Rules — Working in VS Code with Claude

**Environment:** contestants open the `processdesk-student` folder in VS Code, run `npm install` then `npm run dev`, and may use Claude in the editor (Claude Code or the VS Code extension), along with documentation, search, and any other tools.

**What Claude may do:** read the whole repo, explain it, locate bugs, apply fixes, and **refactor the entire codebase** (rename, split, extract, restructure, add tests) where that helps contestants fix bugs correctly.

**What still must hold** (from `QUESTION_PAPER.md`; the security boundary is non-negotiable no matter who writes the code):
- Preserve `contextIsolation: true` and `nodeIntegration: false`.
- Do not move OS access into React, bypass the preload bridge, or import Electron in renderer code.
- Do not remove functionality just to stop errors, and do not change the setup workflow (`npm install`, `npm run dev`).
- Refactors must not change the IPC contract in `docs/IPC_FLOW.md` (channel names and payload shapes) without updating docs and tests to match.
- Remove noisy debug logging before submission. `npm test` and `npm run lint:structure` should pass.

**Suggested workflow:** reproduce one requirement, follow it through the layers (see `docs/DEBUGGING_PLAYBOOK.md`), fix the smallest responsible layer, and re-test the original behavior plus one nearby behavior. Claude speeds up each step, but the contestant must be able to explain *why* each fix works.

---

## 6. Documentation & Fix Verification

**Per-bug report format:**
- Bug ID (1–10)
- Feature / File
- Tier (very easy / easy / medium / hard)
- Symptom observed
- Root cause (the underlying mechanism, not just what changed)
- Fix applied (diff summary)
- Verification steps (must match the bug's Signal in Section 4)
- Whether Claude was used, and what prompt or approach found the bug (contest-specific)
- Time spent

**Root cause requirement:** explain the mechanism. Examples: "stale closure, `paused` missing from the `useCallback` dependencies", "payload shape mismatch between renderer adapter and preload contract", "unit mismatch KB vs bytes".

**Fix verification method:** a before/after repro (screenshot, log, or short recording) matching the Signal for that bug. The evaluator may also run functional checks against the ten required behaviors in `QUESTION_PAPER.md`.

**Grading:** a mark is awarded only when the behavior works *and* the fix respects the architecture and the renderer/main security boundary. Marks per tier are listed in Section 3. See `INSTRUCTOR_GUIDE.md` for the answer key.

---

## 7. Time Allocation

Suggested total: **60 minutes** (per `QUESTION_PAPER.md`).

- 10 min — codebase orientation (with Claude's help if desired)
- 40 min — bug hunting and fixing
- 10 min — verification and bug report

**Expected completion by skill level:**
- Struggling: both very easy bugs, maybe 1 easy
- Average: both very easy + both easy + 2–3 medium
- Strong: all very easy, easy, and medium bugs
- Excellent: all 10, including both Hard bugs

---

## 8. Package Layout

| Package | Audience | Contents |
|---|---|---|
| `processdesk-student/` | Contestants | Buggy codebase, `QUESTION_PAPER.md`, `docs/`, tests |
| `processdesk-instructor/` | Organizers only | Fixed reference codebase plus `INSTRUCTOR_GUIDE.md` (answer key and marking) |

Only the student package is distributed. Both were refactored together into a readable multi-line style (channel constants, `createMainWindow`, `handleInvoke`, `bridge.js`, `useSelectedProcess`, pure helpers). The student package differs from the instructor package only at the ten bug sites, in eight source files, plus the instructor-only `INSTRUCTOR_GUIDE.md`, `tests/verify/` and `test:verify` script. `npm test` and `npm run lint:structure` pass on both; `npm run test:verify` (instructor) passes on the fixed code and fails on bugs 3, 6, 7 and 8 in the student code.

---

## Next Steps

- ~~Update `QUESTION_PAPER.md` with the AI-assisted rules~~ — done in both packages
- ~~Add a per-bug report template~~ — `BUG_REPORT_TEMPLATE.md` in both packages
- Launch the Electron app once on the contest machines (`npm run dev`) and walk through the manual checks in `INSTRUCTOR_GUIDE.md`
- Print and distribute the question paper to contestants
