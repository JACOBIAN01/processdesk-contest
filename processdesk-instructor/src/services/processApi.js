import { getBridge } from './bridge.js';

// Renderer-side adapter for the preload bridge. Channel names and payloads: docs/IPC_FLOW.md.
export const processApi = {
  list: () => getBridge().listProcesses(),
  // End process: graceful termination of one PID.
  kill: (pid) => getBridge().killProcess(pid),
  // Force kill: forced termination of one PID (a different path from End process).
  forceKill: (pid) => getBridge().forceKillProcess(pid),
};
