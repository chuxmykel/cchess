import { difficultyOf, hardestFind } from '../difficulty';
import { makeReviewedMove as move } from '../../../testUtils/reviewedMove';

describe('difficultyOf', () => {
  it('calls a best move an only move when the next best gave a lot away', () => {
    // Level for white, and the next best losing.
    expect(difficultyOf(move(0, { best: true, before: 0, second: -400 }))).toBe(
      'only',
    );
  });

  it('calls it hard to find short of that, and says nothing of an easy one', () => {
    expect(difficultyOf(move(0, { best: true, before: 0, second: -100 }))).toBe(
      'hard',
    );
    expect(
      difficultyOf(move(0, { best: true, before: 0, second: -10 })),
    ).toBeNull();
  });

  it('rates only a best move - never a forced one, a recapture or a book move', () => {
    const wide = { before: 0, second: -400 };
    expect(difficultyOf(move(0, { ...wide }))).toBeNull();
    expect(
      difficultyOf(move(0, { ...wide, best: true, moveClass: 'forced' })),
    ).toBeNull();
    expect(
      difficultyOf(move(0, { ...wide, best: true, isRecapture: true })),
    ).toBeNull();
    expect(
      difficultyOf(move(0, { ...wide, best: true, moveClass: 'book' })),
    ).toBeNull();
    expect(difficultyOf(move(0, { best: true, before: 0 }))).toBeNull();
  });

  it("reads the gap from black's side for black's move", () => {
    // Level, and black's next best leaving white winning.
    expect(difficultyOf(move(1, { best: true, before: 0, second: 400 }))).toBe(
      'only',
    );
  });
});

describe('hardestFind', () => {
  it("picks the side's widest gap, leaving the other side's out", () => {
    const moves = [
      move(0, { best: true, before: 0, second: -60 }),
      move(1, { best: true, before: 0, second: 900 }),
      move(2, { best: true, before: 0, second: -400 }),
    ];

    expect(hardestFind(moves, 'w')).toMatchObject({
      index: 2,
      difficulty: 'only',
    });
    expect(hardestFind([moves[0]], 'b')).toBeNull();
  });
});
