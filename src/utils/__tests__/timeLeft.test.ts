import { formatTimeLeft } from '../timeLeft';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('formatTimeLeft', () => {
  it.each([
    [3 * DAY, '3 days'],
    [DAY, '1 day'],
    [DAY + 4 * HOUR, '1 day 4h'],
    [2 * DAY + 4 * HOUR + 30 * MINUTE, '2 days 4h'],
    [5 * HOUR + 12 * MINUTE, '5h 12m'],
    [5 * HOUR, '5h'],
    [12 * MINUTE, '12m'],
    [45_000, '45s'],
    [0, '0s'],
  ])('shows %s ms as %s', (ms, expected) => {
    expect(formatTimeLeft(ms)).toBe(expected);
  });

  it('rounds up, so it never reads less than is left', () => {
    expect(formatTimeLeft(11 * MINUTE + 1)).toBe('12m');
    expect(formatTimeLeft(DAY - 1)).toBe('1 day');
  });
});
