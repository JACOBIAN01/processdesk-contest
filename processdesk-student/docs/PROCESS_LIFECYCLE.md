# Process termination lifecycle

```mermaid
sequenceDiagram
  participant UI as Process Inspector
  participant API as Renderer Process API
  participant Preload as Preload Bridge
  participant IPC as Main IPC Handler
  participant Svc as Process Service
  participant OS as Operating System
  UI->>API: kill(pid, force?)
  API->>Preload: narrow bridge call
  Preload->>IPC: invoke channel + PID
  IPC->>Svc: validated request
  Svc->>OS: SIGTERM or SIGKILL
  OS-->>Svc: result / error
  Svc-->>UI: Promise resolution
```

Graceful termination sends `SIGTERM`; force termination sends `SIGKILL`. The service refuses to signal ProcessDesk's own main process, and translates `ESRCH` / `EPERM` into readable errors. (On Windows, Node maps both signals to a forced termination.)
