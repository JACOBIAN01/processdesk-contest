import { normalizeText } from './normalizeText.js';

// Case-insensitive match against PID, process name, or user.
export function filterProcesses(list, query) {
  const needle = normalizeText(query);
  if (!needle) return list;
  return list.filter(
    (p) =>
      String(p.pid).includes(needle) ||
      normalizeText(p.name).includes(needle) ||
      normalizeText(p.user).includes(needle),
  );
}

// Returns a sorted copy; strings compare alphabetically, numbers numerically.
export function sortProcesses(list, { key, direction }) {
  const factor = direction === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === 'string') return av.localeCompare(bv) * factor;
    return ((av ?? 0) - (bv ?? 0)) * factor;
  });
}
