const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const HOURS_PER_DAY = 24;

/** Under this, a daily game's time left is shown as running out, in red -
 * on its card and its clock. */
export const DAILY_LOW_TIME_MS = 10 * HOUR_MS;

/**
 * Time left until a deadline, rounded up so it never reads less than is
 * left: to the hour from an hour up - "3 days", "1 day 5h", "6h" - to the
 * minute under an hour - "12m" - and to the second in the last minute.
 */
export function formatTimeLeft(ms: number): string {
  if (ms < MINUTE_MS) return `${Math.max(Math.ceil(ms / 1000), 0)}s`;
  const minutes = Math.ceil(ms / MINUTE_MS);
  if (minutes < 60) return `${minutes}m`;
  const totalHours = Math.ceil(ms / HOUR_MS);
  const days = Math.floor(totalHours / HOURS_PER_DAY);
  const hours = totalHours % HOURS_PER_DAY;
  if (days === 0) return `${hours}h`;
  const daysPart = `${days} ${days === 1 ? 'day' : 'days'}`;
  return hours > 0 ? `${daysPart} ${hours}h` : daysPart;
}
