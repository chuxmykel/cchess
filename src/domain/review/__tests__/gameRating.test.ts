import { gameRating } from '../gameRating';

describe('gameRating', () => {
  describe('with no rating to go on', () => {
    it('reads the rating off the curve, rounded to 50', () => {
      expect(gameRating(65)).toBe(1100);
      expect(gameRating(70)).toBe(1300);
      expect(gameRating(85)).toBe(1900);
    });

    it('rises with accuracy', () => {
      const ratings = [30, 50, 66.9, 74, 81.7, 90, 99].map((a) =>
        gameRating(a),
      );
      expect([...ratings].sort((a, b) => a - b)).toEqual(ratings);
    });

    it('keeps to the ends of the curve', () => {
      expect(gameRating(-5)).toBe(100);
      expect(gameRating(100)).toBe(2950);
      expect(gameRating(140)).toBe(2950);
    });
  });

  describe("anchored on the player's rating", () => {
    it('stays at their rating for a game played as usual', () => {
      // 75% is what a 1450 usually plays.
      expect(gameRating(75, 1450)).toBe(1450);
    });

    it('goes above it for a game played better, below for one worse', () => {
      expect(gameRating(90, 1550)).toBeGreaterThan(1550);
      expect(gameRating(55, 1550)).toBeLessThan(1550);
    });

    it('moves only part of the way to what accuracy alone says', () => {
      // 47.8% alone reads as about 600; a 2000 player stays well above it.
      expect(gameRating(47.8, 2000)).toBe(1300);
    });

    it('never falls below 50', () => {
      expect(gameRating(0, 0)).toBe(50);
    });
  });
});
