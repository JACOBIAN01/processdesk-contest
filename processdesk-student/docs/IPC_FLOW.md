# IPC flow

| Feature | Renderer API | IPC channel | Main handler | Service |
|---|---|---|---|---|
| List processes | `processApi.list()` | `processes:list` | `processHandlers` | `processService.listProcesses` |
| End process | `processApi.kill(pid)` | `processes:kill` | `processHandlers` | `processService.killProcess` |
| Force kill | `processApi.forceKill(pid)` | `processes:force-kill` | `processHandlers` | `processService.forceKillProcess` |
| System summary | `systemApi.summary()` | `system:summary` | `systemHandlers` | `systemService.getSystemSummary` |
| Minimize / close window | `window.processDesk.minimize()` / `close()` | `window:minimize` / `window:close` | `windowHandlers` | — |

Use this document as the contract. UI behavior should match these names and payloads.

## Where channel names live

- `electron/ipc/channels.js` — the main-process source of truth (`CHANNELS`).
- `electron/preload.js` — repeats the strings literally, because a sandboxed preload cannot require local files.
- `tests/integration/contracts.test.js` — fails if the two drift apart or a channel is missing from this document.

If you rename a channel or change a payload, update all three plus this table.
