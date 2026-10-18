/**
 * Formats an ISO date as a short relative label ("Just now", "5m ago", "in 3h").
 */
export function timeAgo(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - Date.parse(iso);
  if (Number.isNaN(diff)) return '';
  const future = diff < 0;
  const abs = Math.abs(diff);
  const min = Math.round(abs / 60000);
  if (min < 1) return future ? 'in <1m' : 'Just now';
  const label =
    min < 60 ? `${min}m` : min < 60 * 24 ? `${Math.round(min / 60)}h` : `${Math.round(min / (60 * 24))}d`;
  return future ? `in ${label}` : `${label} ago`;
}
