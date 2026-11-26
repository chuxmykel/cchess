import { badgesOf } from '../badges';
import {
  cp,
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
