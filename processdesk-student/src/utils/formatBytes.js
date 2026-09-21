const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

// Formats a byte count (not kilobytes) as a human-readable string.
export function formatBytes(bytes = 0) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return '0 B';

  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < UNITS.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit < 2 ? 0 : 1)} ${UNITS[unit]}`;
}
