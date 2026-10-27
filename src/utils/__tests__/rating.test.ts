import { formatRating } from '../rating';

describe('formatRating', () => {
  it('shows a settled rating as it is', () => {
    expect(formatRating(1520, false)).toBe('1520');
  });

  it('marks a provisional rating with a question mark', () => {
    expect(formatRating(1520, true)).toBe('1520?');
  });
});
