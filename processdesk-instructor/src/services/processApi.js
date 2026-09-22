import { getBridge } from './bridge.js';

// Renderer-side adapter for the preload bridge. Channel names and payloads: docs/IPC_FLOW.md.
export const processApi = {
  list: () => getBridge().listProcesses(),
  // End process: should gracefully terminate the process at the given PID, giving it a
  // chance to clean up before it exits.
  kill: (pid) => getBridge().killProcess(pid),
  // Force kill: should immediately and forcefully terminate the process at the given PID,
  // using a different, harsher path than End process so it also stops processes that
  // ignore a graceful termination request.
  forceKill: (pid) => getBridge().forceKillProcess(pid),
};
