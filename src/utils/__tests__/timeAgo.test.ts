import { formatTimeAgo } from '../timeAgo';

const NOW = new Date('2026-10-26T12:00:00.000Z').getTime();

function ago(ms: number): string {
  return new Date(NOW - ms).toISOString();
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('formatTimeAgo', () => {
  it.each([
    [30 * SECOND, 'just now'],
    [MINUTE, '1m ago'],
    [59 * MINUTE, '59m ago'],
    [HOUR, '1h ago'],
    [23 * HOUR, '23h ago'],
    [DAY, 'yesterday'],
    [2 * DAY, '2d ago'],
    [6 * DAY, '6d ago'],
    [7 * DAY, '1w ago'],
    [29 * DAY, '4w ago'],
    [30 * DAY, '1mo ago'],
    [364 * DAY, '12mo ago'],
    [365 * DAY, '1y ago'],
  ])('%i ms ago reads "%s"', (elapsed, expected) => {
    expect(formatTimeAgo(ago(elapsed), NOW)).toBe(expected);
  });

  it('treats a time slightly in the future, from clock skew, as just now', () => {
    expect(formatTimeAgo(ago(-5 * SECOND), NOW)).toBe('just now');
  });
});
