import {
  highestRating,
  formatRating,
  formatRatingRange,
  formatScore,
  formatTimePlayed,
} from '../rating';

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

describe('highestRating', () => {
  const blitz = {
    category: 'blitz' as const,
    rating: 1800,
    gamesPlayed: 3,
    provisional: true,
  };
  const bullet = {
    category: 'bullet' as const,
    rating: 1700,
    gamesPlayed: 40,
    provisional: false,
  };
  const rapid = {
    category: 'rapid' as const,
    rating: 1900,
    gamesPlayed: 0,
    provisional: true,
  };

  it('picks the highest rating, however few games it took', () => {
    expect(highestRating([bullet, blitz])).toBe(blitz);
  });

  it('skips categories never played', () => {
    expect(highestRating([bullet, rapid])).toBe(bullet);
    expect(highestRating([rapid])).toBeNull();
    expect(highestRating([])).toBeNull();
  });
});

describe('formatScore', () => {
  it('counts a draw as half a point to each side', () => {
    expect(formatScore({ wins: 2, draws: 1, losses: 3 })).toBe('2½ - 3½');
    expect(formatScore({ wins: 0, draws: 1, losses: 0 })).toBe('½ - ½');
    expect(formatScore({ wins: 1, draws: 0, losses: 0 })).toBe('1 - 0');
  });
});

describe('formatTimePlayed', () => {
  it('shows days, hours and minutes', () => {
    expect(formatTimePlayed((3 * 60 + 5) * 60_000)).toBe('3 hours, 5 minutes');
    expect(formatTimePlayed(0)).toBe('0 minutes');
  });
});
