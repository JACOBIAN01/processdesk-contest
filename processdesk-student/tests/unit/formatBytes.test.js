const test = require('node:test');
const assert = require('node:assert/strict');

const load = () => import('../../src/utils/formatBytes.js');

test('formatBytes returns "0 B" for empty or invalid input', async () => {
  const { formatBytes } = await load();
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(-5), '0 B');
  assert.equal(formatBytes(NaN), '0 B');
  assert.equal(formatBytes(undefined), '0 B');
});

test('formatBytes scales through KB, MB and GB', async () => {
  const { formatBytes } = await load();
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1024 * 1024), '1.0 MB');
  assert.equal(formatBytes(1.5 * 1024 ** 3), '1.5 GB');
});
