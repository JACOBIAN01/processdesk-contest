# ProcessDesk Debugging Contest

**Duration:** 60 minutes  
**Mode:** Open book. Internet, documentation, Google, and AI tools are permitted — including Claude in VS Code (Claude Code or the VS Code extension).  
**Goal:** Inspect, debug, and refactor an existing Electron + React desktop application in VS Code. Restore the required behavior; you may use Claude to refactor the codebase as widely as you like, provided the architecture and security boundary survive.

## Scenario
You have joined a desktop-platform team that owns **ProcessDesk**, an htop-inspired process monitor. A recent refactor introduced regressions. The repository is intentionally structured like a larger product: renderer components, feature hooks, renderer-side API adapters, a preload bridge, IPC handlers, domain services, repositories, validators, utilities, documentation, and tests.

Your task is to restore the required behavior and leave the codebase in a healthier state than you found it.

## Setup
```bash
npm install
npm run dev
```

Do not change the setup workflow.

## Required working behavior
By submission time all of the following must work correctly:

1. Typing in the process search box must immediately filter by PID, process name, or user, case-insensitively.
2. The **Refresh** button must immediately fetch a fresh process snapshot without changing the pause state.
3. Clicking the currently sorted column must alternate between ascending and descending order.
4. Process memory values must be displayed using the correct units.
5. **Pause** must stop automatic process-list replacement; **Resume** must restart it.
6. **End process** must terminate the selected PID using the graceful termination path.
7. **Force kill** must use the force-termination path, not the same path as graceful termination.
8. The memory utilization card must show **used memory / total memory**, not free/available memory.
9. If multiple process requests overlap, an older response must never overwrite a newer snapshot.
10. When a selected process remains in the refreshed snapshot, the inspector must show its latest values; if it disappears, the selection must clear.

## Refactoring with AI
- You may ask Claude to read, explain, restructure, rename, split, or extract code anywhere in the repository, and to write additional tests.
- A refactor must keep the layered architecture in `docs/ARCHITECTURE.md`. Do not collapse layers into one file or rewrite the application from scratch.
- The IPC contract in `docs/IPC_FLOW.md` (channel names and payload shapes) must stay valid. If you change it, update the preload bridge, handlers, tests, and docs together.
- You must be able to explain the root cause of every fix in your own words.

## Constraints
- Preserve `contextIsolation: true` and `nodeIntegration: false`.
- Do not move OS access into React.
- Do not bypass the preload bridge.
- Do not replace the architecture with direct imports from Electron in renderer code.
- Do not remove functionality merely to make the application stop throwing errors.
- You may add logs while debugging, but remove noisy debugging output before submission.
- `npm test` and `npm run lint:structure` must pass at submission.

## Submission
Submit the complete repository together with a completed `BUG_REPORT_TEMPLATE.md` (one entry per bug you fixed, including whether and how Claude helped). The evaluator may inspect the implementation and run functional checks. Fixes will be judged on correctness and whether they respect the existing architecture.
