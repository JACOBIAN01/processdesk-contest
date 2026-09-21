const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { CHANNELS } = require('../../electron/ipc/channels');
const { APP_CONFIG } = require('../../electron/config/appConfig');

const root = path.join(__dirname, '..', '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('every IPC channel is exposed by the preload bridge', () => {
  const preload = read('electron/preload.js');
  for (const channel of Object.values(CHANNELS)) {
    assert.ok(preload.includes(`'${channel}'`), `preload.js is missing channel ${channel}`);
  }
});

test('preload only uses channels that are declared in channels.js', () => {
  const preload = read('electron/preload.js');
  const used = [...preload.matchAll(/'([a-z]+:[a-z-]+)'/g)].map((m) => m[1]);
  assert.ok(used.length > 0);
  for (const channel of used) {
    assert.ok(Object.values(CHANNELS).includes(channel), `undeclared channel ${channel}`);
  }
});

test('process and system channels are documented in docs/IPC_FLOW.md', () => {
  const doc = read('docs/IPC_FLOW.md');
  for (const channel of [
    CHANNELS.PROCESSES_LIST,
    CHANNELS.PROCESSES_KILL,
    CHANNELS.PROCESSES_FORCE_KILL,
    CHANNELS.SYSTEM_SUMMARY,
  ]) {
    assert.ok(doc.includes(`\`${channel}\``), `IPC_FLOW.md does not document ${channel}`);
  }
});

test('preload does not leak ipcRenderer to the page', () => {
  const exposed = read('electron/preload.js').split('exposeInMainWorld')[1] ?? '';
  // Inside the exposed API, ipcRenderer may only be called, never handed over.
  assert.ok(!/ipcRenderer(?!\.(invoke|send)\()/.test(exposed));
});

test('window security preferences stay locked down', () => {
  assert.equal(APP_CONFIG.webPreferences.contextIsolation, true);
  assert.equal(APP_CONFIG.webPreferences.nodeIntegration, false);
});
