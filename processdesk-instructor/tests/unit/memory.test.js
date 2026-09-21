const test = require('node:test');
const assert = require('node:assert/strict');

const load = () => import('../../src/utils/memory.js');

test('kbToBytes converts kilobytes to bytes', async () => {
  const { kbToBytes } = await load();
  assert.equal(kbToBytes(1), 1024);
  assert.equal(kbToBytes(2048), 2097152);
});

test('kbToBytes tolerates missing values', async () => {
  const { kbToBytes } = await load();
  assert.equal(kbToBytes(), 0);
  assert.equal(kbToBytes(null), 0);
});
