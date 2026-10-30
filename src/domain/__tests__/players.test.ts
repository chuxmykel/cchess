import { colorPlayedBy, otherColor, playerOf, ratingDiffOf } from '../players';

const GAME = {
  white: { id: 'magnus' },
  black: { id: 'judit' },
  whiteRatingDiff: 8,
  blackRatingDiff: -8,
};

describe('otherColor', () => {
  it('gives the other side', () => {
    expect(otherColor('w')).toBe('b');
    expect(otherColor('b')).toBe('w');
  });
});

describe('playerOf', () => {
  it("picks each side's player", () => {
    expect(playerOf(GAME, 'w')).toBe(GAME.white);
    expect(playerOf(GAME, 'b')).toBe(GAME.black);
  });
});

describe('ratingDiffOf', () => {
  it("picks each side's rating change", () => {
    expect(ratingDiffOf(GAME, 'w')).toBe(8);
    expect(ratingDiffOf(GAME, 'b')).toBe(-8);
  });

  it('has none for a game not rated yet', () => {
    expect(
      ratingDiffOf({ whiteRatingDiff: null, blackRatingDiff: null }, 'w'),
    ).toBeNull();
  });
});

describe('colorPlayedBy', () => {
  it('finds the side a player played', () => {
    expect(colorPlayedBy(GAME, 'magnus')).toBe('w');
    expect(colorPlayedBy(GAME, 'judit')).toBe('b');
  });

  it("has none for someone who didn't play", () => {
    expect(colorPlayedBy(GAME, 'hikaru')).toBeNull();
  });
});
