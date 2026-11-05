import { formatTimeLeft } from '../timeLeft';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('formatTimeLeft', () => {
  it.each([
    [3 * DAY, '3 days'],
    [DAY, '1 day'],
    [DAY + 4 * HOUR, '1 day 4h'],
    [5 * HOUR, '5h'],
    [12 * MINUTE, '12m'],
    [45_000, '45s'],
    [0, '0s'],
  ])('shows %s ms as %s', (ms, expected) => {
    expect(formatTimeLeft(ms)).toBe(expected);
  });

  it('rounds up to the hour from an hour up', () => {
    expect(formatTimeLeft(5 * HOUR + 12 * MINUTE)).toBe('6h');
    expect(formatTimeLeft(DAY + 4 * HOUR + 30 * MINUTE)).toBe('1 day 5h');
    expect(formatTimeLeft(23 * HOUR + 30 * MINUTE)).toBe('1 day');
    expect(formatTimeLeft(HOUR + 1)).toBe('2h');
  });

  it('rounds up to the minute under an hour', () => {
    expect(formatTimeLeft(11 * MINUTE + 1)).toBe('12m');
    expect(formatTimeLeft(59 * MINUTE + 30_000)).toBe('1h');
  });
});
