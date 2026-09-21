const test = require('node:test');
const assert = require('node:assert/strict');
const { mapProcess } = require('../../electron/services/processMapper');

test('mapProcess fills defaults for a sparse record', () => {
  const mapped = mapProcess({ pid: '42' });
  assert.equal(mapped.pid, 42);
  assert.equal(mapped.name, 'Unknown');
  assert.equal(mapped.user, '—');
  assert.equal(mapped.cpu, 0);
  assert.equal(mapped.memoryRss, 0);
  assert.equal(mapped.state, 'unknown');
});

test('mapProcess renames provider fields to the renderer contract', () => {
  const mapped = mapProcess({
    pid: 7,
    parentPid: 1,
    name: 'node',
    cpu: 12.5,
    mem: 3.2,
    memRss: 2048,
  });
  assert.equal(mapped.parentPid, 1);
  assert.equal(mapped.memory, 3.2);
  assert.equal(mapped.memoryRss, 2048);
});
