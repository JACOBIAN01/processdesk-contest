const test = require('node:test');
const assert = require('node:assert/strict');

const load = () => import('../../src/utils/processFilter.js');

const SAMPLE = [
  { pid: 101, name: 'node', user: 'alice', cpu: 5 },
  { pid: 202, name: 'Chrome', user: 'bob', cpu: 40 },
  { pid: 303, name: 'zsh', user: 'Alice', cpu: 1 },
];

test('filter matches process name', async () => {
  const { filterProcesses } = await load();
  assert.deepEqual(
    filterProcesses(SAMPLE, 'node').map((p) => p.pid),
    [101],
  );
});

test('filter is case-insensitive', async () => {
  const { filterProcesses } = await load();
  assert.deepEqual(
    filterProcesses(SAMPLE, 'CHROME').map((p) => p.pid),
    [202],
  );
});

test('filter matches user and PID', async () => {
  const { filterProcesses } = await load();
  assert.deepEqual(
    filterProcesses(SAMPLE, 'alice').map((p) => p.pid),
    [101, 303],
  );
  assert.deepEqual(
    filterProcesses(SAMPLE, '202').map((p) => p.pid),
    [202],
  );
});

test('empty query returns everything', async () => {
  const { filterProcesses } = await load();
  assert.equal(filterProcesses(SAMPLE, '   ').length, 3);
});

test('sort orders numbers and strings in both directions', async () => {
  const { sortProcesses } = await load();
  const cpuDesc = sortProcesses(SAMPLE, { key: 'cpu', direction: 'desc' }).map((p) => p.pid);
  const cpuAsc = sortProcesses(SAMPLE, { key: 'cpu', direction: 'asc' }).map((p) => p.pid);
  const nameAsc = sortProcesses(SAMPLE, { key: 'name', direction: 'asc' }).map((p) => p.name);
  assert.deepEqual(cpuDesc, [202, 101, 303]);
  assert.deepEqual(cpuAsc, [303, 101, 202]);
  assert.deepEqual(nameAsc, ['Chrome', 'node', 'zsh']);
});

test('sort does not mutate its input', async () => {
  const { sortProcesses } = await load();
  const before = SAMPLE.map((p) => p.pid);
  sortProcesses(SAMPLE, { key: 'cpu', direction: 'desc' });
  assert.deepEqual(
    SAMPLE.map((p) => p.pid),
    before,
  );
});
