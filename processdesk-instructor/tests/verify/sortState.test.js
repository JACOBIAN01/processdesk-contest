// Instructor verification — Bug 3 (sort direction toggle).
const test = require('node:test');
const assert = require('node:assert/strict');

const load = () => import('../../src/utils/sortState.js');

test('clicking the active column alternates asc/desc', async () => {
  const { nextSort } = await load();
  const first = nextSort({ key: 'cpu', direction: 'desc' }, 'cpu');
  const second = nextSort(first, 'cpu');
  assert.deepEqual(first, { key: 'cpu', direction: 'asc' });
  assert.deepEqual(second, { key: 'cpu', direction: 'desc' });
});

test('clicking a different column starts descending', async () => {
  const { nextSort } = await load();
  assert.deepEqual(nextSort({ key: 'cpu', direction: 'asc' }, 'name'), {
    key: 'name',
    direction: 'desc',
  });
});
