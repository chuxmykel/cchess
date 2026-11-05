const MINUTE_MS = 60_000;
const MINUTES_PER_DAY = 24 * 60;

/** Under this, a daily game's time left is shown as running out. */
export const DAILY_LOW_TIME_MS = 60 * MINUTE_MS;

/**
 * A daily game's time left on a move, in its two largest units: "3 days",
 * "1 day 4h", "5h 12m", "12m" - or seconds, in its last minute. Rounded
 * up, as the live clock is, so it never reads less than is left.
 */
export function formatTimeLeft(ms: number): string {
  if (ms < MINUTE_MS) return `${Math.max(Math.ceil(ms / 1000), 0)}s`;
  const totalMinutes = Math.ceil(ms / MINUTE_MS);
  const days = Math.floor(totalMinutes / MINUTES_PER_DAY);
  const hours = Math.floor((totalMinutes % MINUTES_PER_DAY) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) {
    const daysPart = `${days} ${days === 1 ? 'day' : 'days'}`;
    return hours > 0 ? `${daysPart} ${hours}h` : daysPart;
  }
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${minutes}m`;
}
