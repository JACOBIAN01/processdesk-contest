export function formatPercent(value = 0) {
  return `${Number(value || 0).toFixed(1)}%`;
}
