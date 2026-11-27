import { reviewDigests, sideDigest } from '../digest';
import { patternsOf } from '../patterns';
import {
  cp,
  ENDGAME,
  makeReview,
  makeReviewedMove as move,
} from '../../../testUtils/reviewedMove';

describe('digest', () => {
  it("boils a side's review down: its slips by phase and clock, missed tactics", () => {
    const review = makeReview(
      [
        move(0, { moveClass: 'book' }),
        move(1),
        move(2, {
          moveClass: 'blunder',
          facts: [{ kind: 'hangs', piece: 'queen' }],
        }),
        move(3),
        move(4, {
          moveClass: 'miss',
          fen: ENDGAME,
          facts: [{ kind: 'missesWin', piece: 'rook' }],
        }),
      ],
      { scores: [cp(0)] },
    );
    const clock = {
      initialMs: 100_000,
      incrementMs: 0,
      afterMs: [100_000, 100_000, 80_000, 90_000, 20_000],
    };

    const digest = sideDigest(review, 'w', 'black', clock);

    expect(digest).toMatchObject({
      v: 1,
      result: 'loss',
      opening: 'Four Knights Game',
      moves: 3,
      missedTactics: 1,
    });
    expect(digest.slips).toEqual([
      { ply: 3, mark: '??', facts: ['hangs'], phase: 'opening', clockShare: 1 },
      {
        ply: 5,
        mark: '?',
        facts: ['missesWin'],
        phase: 'opening',
        clockShare: 0.8,
      },
    ]);
    expect(digest).not.toHaveProperty('badges');
    expect(Object.keys(reviewDigests(review, 'black', null))).toEqual([
      'w',
      'b',
    ]);
    expect(
      sideDigest(review, 'w', 'black', null).slips[0].clockShare,
    ).toBeNull();
  });
});

describe('digest: the figures patterns read', () => {
  it('averages accuracy by phase, counts the marks and the chances after the book', () => {
    const review = makeReview(
      [
        move(0, { moveClass: 'book', accuracy: 100 }),
        move(1, { moveClass: 'book' }),
        // Out of the book: white +300, then black's slip lets in +900.
        move(2, { moveClass: 'great', accuracy: 98, after: 300 }),
        move(3, { moveClass: 'mistake', after: 900 }),
        move(4, {
          moveClass: 'blunder',
          accuracy: 20,
          fen: ENDGAME,
          after: -400,
        }),
      ],
      { scores: [cp(0)] },
    );

    const white = sideDigest(review, 'w', 'black', null);
    // Ten moves either side of the book still count as the opening.
    expect(white.accuracyByPhase).toEqual({
      opening: 72.7,
      middlegame: null,
      endgame: null,
    });
    expect(white.marks).toEqual({ '!!': 0, '!': 1, '?!': 0, '?': 0, '??': 1 });
    expect(white.chances.high).toBeGreaterThan(90);
    expect(white.chances.low).toBeLessThan(35);
    const black = sideDigest(review, 'b', 'black', null);
    expect(black.marks['?']).toBe(1);
    expect(black.chances.low).toBeLessThan(10);
  });
});

describe('patternsOf', () => {
  const digest = sideDigest(
    makeReview(
      [
        move(0, {
          moveClass: 'blunder',
          facts: [{ kind: 'allowsFork', piece: 'knight' }],
        }),
      ],
      { scores: [cp(0)] },
    ),
    'w',
    'black',
    null,
  );

  it('totals slips by phase, the openings and the themes slipped on', () => {
    const patterns = patternsOf([
      { gameId: 'a', color: 'w', endedAt: null, digest },
      { gameId: 'b', color: 'w', endedAt: null, digest },
    ]);

    expect(patterns.games).toBe(2);
    expect(patterns.slipsByPhase.opening).toBe(2);
    expect(patterns.weakThemes).toEqual([{ theme: 'fork', count: 2 }]);
    expect(patterns.openings).toEqual([
      {
        name: 'Four Knights Game',
        color: 'w',
        games: 2,
        wins: 0,
        draws: 0,
        losses: 2,
        accuracy: 90,
      },
    ]);
  });

  it('says nothing of games it has none of', () => {
    expect(patternsOf([])).toMatchObject({
      games: 0,
      accuracy: null,
      accuracyByClock: null,
      weakThemes: [],
    });
  });
});
