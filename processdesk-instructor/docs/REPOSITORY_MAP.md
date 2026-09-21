# Repository map

## Main process (`electron/`)
- `main.js` — Electron lifecycle only.
- `window/createMainWindow.js` — BrowserWindow creation (dev URL vs packaged build).
- `preload.js` — the only renderer-facing bridge to privileged APIs.
- `config/appConfig.js` — window size, limits, and the locked-down `webPreferences`.
- `ipc/` — `channels.js` (channel names), `handleInvoke.js` (logging wrapper), and one registration file per feature.
- `services/` — domain behavior for processes/system data.
- `repositories/` — low-level OS/systeminformation access.
- `validators/` — boundary validation.
- `utils/` — logger and `AppError`.

## Renderer (`src/`)
- `app/` — application composition.
- `features/` — stateful feature hooks (`useProcessStore`, `useSelectedProcess`, `useSystemSummary`).
- `services/` — renderer-side API adapters; `bridge.js` is the single access point to `window.processDesk`.
- `components/` — presentational UI.
- `constants/`, `hooks/`, `utils/` — shared constants, generic hooks, pure transformations.

## Supporting
- `tests/unit`, `tests/integration` — fast behavior and contract checks (`npm test`).
- `scripts/check-structure.js` — architecture guard (`npm run lint:structure`).
- `docs/` — requirements and design notes.

A useful debugging strategy is to start from the broken UI behavior and move down one layer at a time.
