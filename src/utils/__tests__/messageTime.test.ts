import {
  conversationTime,
  messageClockTime,
  messageDayLabel,
} from '../messageTime';

// Local times, as a phone shows them.
const NOW = new Date(2026, 10, 10, 15, 30);
function at(year: number, month: number, day: number, hour = 9, minute = 5) {
  return new Date(year, month, day, hour, minute).toISOString();
}

describe('messageDayLabel', () => {
  it('names today and yesterday', () => {
    expect(messageDayLabel(at(2026, 10, 10), NOW)).toBe('Today');
    expect(messageDayLabel(at(2026, 10, 9, 23, 59), NOW)).toBe('Yesterday');
  });

  it('names a day this week by its weekday', () => {
    expect(messageDayLabel(at(2026, 10, 6), NOW)).toBe('Friday');
    expect(messageDayLabel(at(2026, 10, 4), NOW)).toBe('Wednesday');
  });

  it('dates anything older, with its year only when it is not this one', () => {
    expect(messageDayLabel(at(2026, 10, 3), NOW)).toBe('Nov 3');
    expect(messageDayLabel(at(2025, 11, 31), NOW)).toBe('Dec 31, 2025');
  });
});

describe('messageClockTime', () => {
  it('gives the time it was sent', () => {
    expect(messageClockTime(at(2026, 10, 10, 9, 5))).toBe('09:05');
  });
});

describe('conversationTime', () => {
  it('gives the time for today, and names any other day', () => {
    expect(conversationTime(at(2026, 10, 10, 14, 2), NOW)).toBe('14:02');
    expect(conversationTime(at(2026, 10, 9), NOW)).toBe('Yesterday');
    expect(conversationTime(at(2026, 10, 7), NOW)).toBe('Saturday');
    expect(conversationTime(at(2026, 9, 1), NOW)).toBe('Oct 1');
  });
});
