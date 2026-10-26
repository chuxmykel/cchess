const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;
const YEAR_MS = 365 * DAY_MS;

export function formatTimeAgo(
  isoDate: string,
  now: number = Date.now(),
): string {
  const elapsedMs = Math.max(0, now - new Date(isoDate).getTime());
  const whole = (unitMs: number) => Math.floor(elapsedMs / unitMs);

  if (elapsedMs < MINUTE_MS) return 'just now';
  if (elapsedMs < HOUR_MS) return `${whole(MINUTE_MS)}m ago`;
  if (elapsedMs < DAY_MS) return `${whole(HOUR_MS)}h ago`;
  if (elapsedMs < 2 * DAY_MS) return 'yesterday';
  if (elapsedMs < WEEK_MS) return `${whole(DAY_MS)}d ago`;
  if (elapsedMs < MONTH_MS) return `${whole(WEEK_MS)}w ago`;
  if (elapsedMs < YEAR_MS) return `${whole(MONTH_MS)}mo ago`;
  return `${whole(YEAR_MS)}y ago`;
}
