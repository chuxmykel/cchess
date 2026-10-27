import { formatRating, formatRatingRange } from '../rating';

describe('formatRating', () => {
  it('shows a settled rating as it is', () => {
    expect(formatRating(1520, false)).toBe('1520');
  });

  it('marks a provisional rating with a question mark', () => {
    expect(formatRating(1520, true)).toBe('1520?');
  });
});

describe('formatRatingRange', () => {
  it('shows the lowest and highest ratings around your own', () => {
    expect(formatRatingRange(1520, { below: 200, above: 500 })).toBe(
      '1320–2020',
    );
  });

  it('shows an open side as having no limit', () => {
    expect(formatRatingRange(1520, { below: null, above: 500 })).toBe(
      'up to 2020',
    );
    expect(formatRatingRange(1520, { below: 200, above: null })).toBe('1320+');
    expect(formatRatingRange(1520, { below: null, above: null })).toBe(
      'Any rating',
    );
  });
});
