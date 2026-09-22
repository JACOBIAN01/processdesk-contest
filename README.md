# ProcessDesk — Contest Project Plan

*Internal contest project name for an htop-inspired desktop process monitor built for teaching purposes — not affiliated with or endorsed by the htop project.*

A desktop process monitor ("ProcessDesk") built in Electron + React + Vite, seeded with intentional bugs for an Application Development coding contest. Contestants work in **VS Code**, inspect and debug the codebase, and are **allowed to use Claude (Claude Code / VS Code extension) to refactor the entire codebase and implement the fixes**.

Status: **implemented** — the student package ships with all 10 bugs seeded and the instructor package holds the fixed reference. This document is the locked plan and the shared reference for both.

> **History:** this is the contest sibling of the *VS Code Lite* mid-sem project. It keeps the same concept and theme (a realistic multi-layer Electron codebase with seeded regressions, a tiered bug list, an observable signal per fix, and a written bug report) but swaps the domain from a code editor to a process monitor and the rules from "fix it yourself" to "fix it with AI assistance". The Taught/New lecture split from the mid-sem is dropped because a contest has no lecture syllabus to draw on; tiers are the only axis of difficulty.

---

## 1. Product Concept

**ProcessDesk** is a desktop process monitor. It lists running processes, refreshes them every 2 seconds, lets you search by PID/name/user, sort by any column, pause/resume the live refresh, refresh manually, inspect a selected process, and end or force-kill it. A summary strip shows system memory, disk, and uptime.

**Target users:** contest participants comfortable with VS Code who must read an unfamiliar, larger-than-a-toy codebase, find regressions, and fix them under time pressure.

**Core value:** the repo is deliberately structured like a real product, not a single file, so finding a bug means reading the right small piece of it, not guessing. Each seeded bug is a realistic, beginner-reachable regression (a mis-wired handler, an inverted condition, a unit mismatch, a wrong payload shape, a wrong field name) rather than invented syntax.

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

## 3. Bug Distribution — 10 Bugs, 2 Tiers

| Tier | Bugs | Marks each | Total marks |
|---|---|---|---|
| Very easy | 4 | 1 | 4 |
| Easy | 6 | 1 | 6 |
| **Total** | **10** | | **10** |

Bugs are spread across renderer UI, feature/state logic, API contracts, Electron service logic, and async behavior, so no single file or layer holds the whole answer.

### Progressive Unlock Design (applies to all tiers)

Every bug has a defined, observable **signal** that fires the moment it is fixed correctly.

| Tier | Pre-fix state (broken) | Signal when fixed |
|---|---|---|
| **Very easy** | Control is dead or does the wrong (often opposite) action | The control responds correctly at once (typing filters, Refresh fetches, Pause actually pauses, Force kill actually force-kills) |
| **Easy** | Feature runs but visibly/measurably shows the wrong thing | Output becomes visibly correct (sort reverses, memory units and percentages are right, End process succeeds, refresh cadence matches the spec, the inspector opens) |

### Which features carry bugs

| Feature | Bugs seeded | Tier(s) |
|---|---|---|
| 1. Process list & auto-refresh | 2 | Very easy, Easy |
| 2. Search | 1 | Very easy |
| 3. Column sorting | 1 | Easy |
| 4. Pause / Resume / Refresh | 1 | Very easy |
| 5. Process table & memory display | 1 | Easy |
| 6. Process inspector | 1 | Easy |
| 7. End process / Force kill | 2 | Very easy, Easy |
| 8. System summary | 1 | Easy |
| 9. Window chrome & error handling | 0 | — bug-free reference implementation |
| **Total** | **10** | |

Feature 9 is left bug-free on purpose. It is still worth reading: the safe-result and validator patterns there show what a correct IPC contract looks like when tracing bugs 6 and 7.

---

## 4. The 10 Bugs

Function and variable names follow the real code (`processApi`, `useProcessStore`, `nextSort`, `memoryRss`) so the seeded bugs read like real regressions.

### Very easy (4)

1. **Search** — the input's `onChange` calls `setQuery(query)`, writing the existing value back, so typing never changes the filter. File: `src/components/toolbar/ProcessToolbar.jsx`. **Signal:** typing in the box immediately filters by PID, name, or user, case-insensitively.
2. **Refresh** — the Refresh button's `onClick` is wired to `setPaused(!paused)` instead of `refresh`. File: `src/components/toolbar/ProcessToolbar.jsx`. **Signal:** clicking Refresh fetches a fresh snapshot and leaves the Pause state alone.
3. **Force kill** — `forceKill` calls `killProcess` (graceful path) instead of `forceKillProcess`, so both buttons use `processes:kill`. File: `src/services/processApi.js`. **Signal:** Force kill goes through `processes:force-kill`.
4. **Pause** — the polling `tick` callback's condition is inverted (`if (paused) refresh()`), so the list never auto-loads while running and Pause triggers a fetch instead of stopping one. File: `src/features/processes/useProcessStore.js`. **Signal:** the list loads and keeps updating every 2 seconds; Pause freezes it and Resume restarts it immediately.

### Easy (6)

5. **Sorting** — the `nextSort` helper returns `'asc'` in both branches, so clicking the sorted column never reverses. File: `src/utils/sortState.js`. **Signal:** repeated clicks on the sorted column alternate ascending / descending.
6. **Memory units** — `memoryRss` arrives in KB but `formatBytes` expects bytes, so every value is about 1024× too small. File: `src/components/processes/ProcessRow.jsx`. **Signal:** memory values show realistic MB/GB figures that match the OS.
7. **Memory card** — the system service computes `percent` from `available / total` instead of `used / total`. File: `electron/services/systemService.js`. **Signal:** the memory card shows used / total.
8. **End process** — the renderer adapter sends `{ pid }` while preload and main expect a bare numeric PID, so validation rejects it as an invalid PID. File: `src/services/processApi.js`. **Signal:** End process terminates the selected PID with no "invalid PID" error.
9. **Auto-refresh cadence** — the polling timer hardcodes `20000` instead of using the `refreshMs` parameter, so the list refreshes roughly every 20 seconds instead of every 2. File: `src/features/processes/useProcessStore.js`. **Signal:** CPU/memory values visibly update every ~2 seconds, not ~20.
10. **Inspector selection** — the hook that derives the selected process from the latest snapshot compares the wrong field (`p.name` instead of `p.pid`), so the lookup never matches and the inspector never opens. File: `src/features/processes/useSelectedProcess.js`. **Signal:** clicking any process row opens the inspector immediately with live values.

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
- Tier (very easy / easy)
- Symptom observed
- Root cause (the underlying mechanism, not just what changed)
- Fix applied (diff summary)
- Verification steps (must match the bug's Signal in Section 4)
- Whether Claude was used, and what prompt or approach found the bug (contest-specific)
- Time spent

**Root cause requirement:** explain the mechanism. Examples: "inverted condition — `if (paused)` instead of `if (!paused)`", "payload shape mismatch between renderer adapter and preload contract", "unit mismatch KB vs bytes".

**Fix verification method:** a before/after repro (screenshot, log, or short recording) matching the Signal for that bug. The evaluator may also run functional checks against the ten required behaviors in `QUESTION_PAPER.md`.

**Grading:** a mark is awarded only when the behavior works *and* the fix respects the architecture and the renderer/main security boundary. Marks per tier are listed in Section 3. See `INSTRUCTOR_GUIDE.md` for the answer key.

---

## 7. Time Allocation

Suggested total: **60 minutes** (per `QUESTION_PAPER.md`).

- 10 min — codebase orientation (with Claude's help if desired)
- 40 min — bug hunting and fixing
- 10 min — verification and bug report

**Expected completion by skill level:**
- Struggling: most or all of the 4 very easy bugs
- Average: all 4 very easy + 2–3 easy bugs
- Strong: all 4 very easy + most of the 6 easy bugs
- Excellent: all 10

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
