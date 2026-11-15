import { gameRating } from '../gameRating';

describe('gameRating', () => {
  it('reads the rating off the curve, rounded to 50', () => {
    expect(gameRating(65)).toBe(1100);
    expect(gameRating(70)).toBe(1300);
    expect(gameRating(85)).toBe(1900);
  });

  it('rises with accuracy', () => {
    const ratings = [30, 50, 66.9, 74, 81.7, 90, 99].map(gameRating);
    expect([...ratings].sort((a, b) => a - b)).toEqual(ratings);
  });

  it('keeps to the ends of the curve', () => {
    expect(gameRating(-5)).toBe(100);
    expect(gameRating(100)).toBe(2950);
    expect(gameRating(140)).toBe(2950);
  });
});
