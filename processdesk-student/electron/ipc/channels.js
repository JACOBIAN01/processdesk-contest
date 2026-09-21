// Single source of truth for IPC channel names on the main-process side.
// The sandboxed preload script cannot require local files, so preload.js repeats
// these strings literally; tests/integration/contracts.test.js keeps both in sync.
const CHANNELS = Object.freeze({
  PROCESSES_LIST: 'processes:list',
  PROCESSES_KILL: 'processes:kill',
  PROCESSES_FORCE_KILL: 'processes:force-kill',
  SYSTEM_SUMMARY: 'system:summary',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_CLOSE: 'window:close',
});

module.exports = { CHANNELS };
