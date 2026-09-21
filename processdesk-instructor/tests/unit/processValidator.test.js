const test = require('node:test');
const assert = require('node:assert/strict');
const { assertPid } = require('../../electron/validators/processValidator');

test('assertPid accepts positive integers', () => {
  assert.equal(assertPid(1234), 1234);
});

test('assertPid rejects everything else', () => {
  for (const bad of [0, -1, 1.5, NaN, null, undefined, '12', true, { pid: 12 }, [12]]) {
    assert.throws(() => assertPid(bad), /Invalid PID/);
  }
});
