import { keyMoments } from '../keyMoments';
import type { MoveClass, ReviewedMove } from '../types';

const moves = (classes: MoveClass[]) =>
  classes.map(
    (moveClass, i) =>
      ({ moveClass, color: i % 2 === 0 ? 'w' : 'b' }) as ReviewedMove,
  );

describe('keyMoments', () => {
  it("stops at the side's slips and standouts, after the book", () => {
    const game = moves([
      'book',
      'book',
      'best',
      'inaccuracy',
      'inaccuracy',
      'good',
      'great',
      'blunder',
    ]);
    expect(keyMoments(game, 'w')).toEqual([1, 4, 6]);
    expect(keyMoments(game, 'b')).toEqual([1, 3, 7]);
  });
});
