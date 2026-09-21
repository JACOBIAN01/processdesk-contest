// Clicking the active column flips its direction; clicking a new column sorts it descending.
export function nextSort(prev, key) {
  if (prev.key !== key) return { key, direction: 'desc' };
  return { key, direction: prev.direction === 'asc' ? 'asc' : 'desc' };
}
