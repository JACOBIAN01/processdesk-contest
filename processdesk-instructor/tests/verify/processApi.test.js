// Instructor verification — Bugs 6 and 7 (kill payload shape and force-kill path).
const test = require('node:test');
const assert = require('node:assert/strict');

async function withBridge(run) {
  const calls = [];
  globalThis.window = {
    processDesk: {
      listProcesses: async () => [],
      killProcess: (arg) => calls.push(['killProcess', arg]),
      forceKillProcess: (arg) => calls.push(['forceKillProcess', arg]),
    },
  };
  try {
    const { processApi } = await import('../../src/services/processApi.js');
    await run(processApi, calls);
  } finally {
    delete globalThis.window;
  }
}

test('kill sends the bare numeric PID to killProcess', () =>
  withBridge((processApi, calls) => {
    processApi.kill(4242);
    assert.deepEqual(calls, [['killProcess', 4242]]);
  }));

test('forceKill uses forceKillProcess, not killProcess', () =>
  withBridge((processApi, calls) => {
    processApi.forceKill(4242);
    assert.deepEqual(calls, [['forceKillProcess', 4242]]);
  }));
