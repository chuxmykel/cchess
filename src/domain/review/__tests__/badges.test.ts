import { badgesOf } from '../badges';
import { reviewDigests, sideDigest } from '../digest';
import { patternsOf } from '../patterns';
import {
  cp,
  ENDGAME,
  makeReview,
  makeReviewedMove as move,
} from '../../../testUtils/reviewedMove';

// A game of white's - scores after each move, from white's side.
function gameOf(after: number[], extra: Parameters<typeof move>[1][] = []) {
  return makeReview(
    after.map((score, i) => move(i, { after: score, ...(extra[i] ?? {}) })),
    { scores: [cp(0), ...after.map(cp)] },
  );
}

describe('badgesOf', () => {
  it('calls a game all but lost and not lost a swindle', () => {
    const review = gameOf([0, -900, -900, 500]);
    expect(badgesOf(review, 'w', 'white')).toContain('swindle');
    expect(badgesOf(review, 'w', 'draw')).toContain('swindle');
    expect(badgesOf(review, 'w', 'black')).not.toContain('swindle');
  });

  it('calls a win from a losing position a comeback, a draw one held', () => {
    const review = gameOf([0, -300, -300, 400]);
    expect(badgesOf(review, 'w', 'white')).toEqual(['comeback']);
    expect(badgesOf(review, 'w', 'draw')).toEqual(['heldDraw']);
  });

  it('calls an accurate game with no ? or ?? clean, long enough', () => {
    const long = makeReview(
      Array.from({ length: 40 }, (_, i) => move(i)),
      { scores: [cp(0)] },
    );
    expect(badgesOf(long, 'w', 'draw')).toContain('clean');

    const slipped = makeReview(
      Array.from({ length: 40 }, (_, i) =>
        move(i, { moveClass: i === 10 ? 'mistake' : 'good' }),
      ),
      { scores: [cp(0)] },
    );
    expect(badgesOf(slipped, 'w', 'draw')).not.toContain('clean');
    expect(
      badgesOf(makeReview([move(0)], { scores: [cp(0)] }), 'w', 'draw'),
    ).not.toContain('clean');
  });

  it('marks a sacrifice that won', () => {
    const review = makeReview(
      [move(0, { facts: [{ kind: 'sacrifice', piece: 'knight' }] })],
      { scores: [cp(0)] },
    );
    expect(badgesOf(review, 'w', 'white')).toContain('sacrifice');
    expect(badgesOf(review, 'w', 'draw')).not.toContain('sacrifice');
  });
});

describe('digest', () => {
  it("boils a side's review down: its slips by phase and clock, missed tactics, badges", () => {
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
    expect(Object.keys(reviewDigests(review, 'black', null))).toEqual([
      'w',
      'b',
    ]);
    expect(
      sideDigest(review, 'w', 'black', null).slips[0].clockShare,
    ).toBeNull();
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
      { name: 'Four Knights Game', games: 2, wins: 0, draws: 0, losses: 2 },
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
