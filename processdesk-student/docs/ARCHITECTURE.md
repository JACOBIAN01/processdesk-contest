# Architecture

ProcessDesk uses four layers so responsibilities stay explicit:

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

The renderer never imports Node or Electron directly. Main-process code owns operating-system access. Services contain behavior; repositories contain data acquisition; validators guard every value that crosses the IPC boundary.

## Layer responsibilities

| Layer | Owns | Must not |
|---|---|---|
| Components (`src/components`) | Markup and event wiring | Fetch data or hold business rules |
| Feature hooks (`src/features`) | State, polling, derived data | Call `window.processDesk` directly |
| Renderer services (`src/services`) | The shape of each bridge call | Import Electron or Node |
| Preload (`electron/preload.js`) | The narrow `window.processDesk` API | Expose `ipcRenderer` itself |
| IPC handlers (`electron/ipc`) | Channel registration, error logging | Contain domain logic |
| Services (`electron/services`) | Behavior (kill, summarise, map) | Talk to the OS libraries directly |
| Repositories (`electron/repositories`) | `systeminformation` / `os` access | Contain business rules |
| Validators (`electron/validators`) | Rejecting malformed payloads | Perform side effects |
