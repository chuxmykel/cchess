import { formatGameCount, percentOf } from '../explorerCounts';

describe('formatGameCount', () => {
  it('writes counts in full up to 100,000', () => {
    expect(formatGameCount(0)).toBe('0');
    expect(formatGameCount(999)).toBe('999');
    expect(formatGameCount(1234)).toBe('1,234');
    expect(formatGameCount(99_999)).toBe('99,999');
  });

  it('shortens larger ones', () => {
    expect(formatGameCount(123_456)).toBe('123k');
    expect(formatGameCount(4_540_000)).toBe('4.5M');
    expect(formatGameCount(12_400_000)).toBe('12M');
  });
});

describe('percentOf', () => {
  it('is a whole percentage, and 0 of none', () => {
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(2, 3)).toBe(67);
    expect(percentOf(0, 0)).toBe(0);
  });
});
