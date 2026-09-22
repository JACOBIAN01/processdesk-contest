// Sorting: clicking the header of the column that is already active should alternate the
// direction between ascending and descending on every click; clicking a different column
// should always start that column sorted descending.
export function nextSort(prev, key) {
  if (prev.key !== key) return { key, direction: 'desc' };
  return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
}
