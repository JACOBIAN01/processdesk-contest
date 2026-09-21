// Instructor verification — Bug 8 (memory card must be used / total).
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildMemorySummary } = require('../../electron/services/systemService');

test('memory percent is used / total, not available / total', () => {
  const summary = buildMemorySummary({ total: 1000, used: 250, available: 750 });
  assert.equal(summary.percent, 25);
  assert.equal(summary.used, 250);
  assert.equal(summary.free, 750);
  assert.equal(summary.total, 1000);
});

test('memory percent is 0 when total is unknown', () => {
  assert.equal(buildMemorySummary({ total: 0, used: 0, available: 0 }).percent, 0);
});
