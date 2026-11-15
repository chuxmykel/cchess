import { DEFAULT_POSITION } from 'chess.js';

import { bestMoveOf, buildReview } from '../../domain/review/buildReview';
import type { PositionEval } from '../../domain/review/types';
import { reviewView, ReviewViewInput } from '../reviewView';

const at = (cp: number, pv: string[]): PositionEval => ({
  score: { kind: 'cp', cp },
  pv,
  second: null,
  depth: 14,
});

// 1. e4 e5 2. Ba6?? bxa6
const REVIEW = buildReview(
  DEFAULT_POSITION,
  ['e2e4', 'e7e5', 'f1a6', 'b7a6'].map((uci) => ({ uci })),
  [
    at(20, ['e2e4']),
    at(30, ['e7e5']),
    at(30, ['g1f3', 'b8c6']),
    at(-300, ['b7a6', 'g1f3']),
    at(-300, ['g1f3', 'd7d6']),
  ],
);

const viewAt = (input: Partial<ReviewViewInput>) =>
  reviewView({
    review: REVIEW,
    phase: 'stepping',
    index: 2,
    mode: { kind: 'move' },
    showLine: false,
    showBestMoves: false,
    theme: null,
    ...input,
  });

describe('reviewView', () => {
  it('starts on the starting position, with the opening words', () => {
    const view = viewAt({ index: -1, phase: 'summary' });

    expect(view.fen).toBe(DEFAULT_POSITION);
    expect(view.lastMove).toBeNull();
    expect(view.bubble.text).toMatch(/key moments/);
    expect(view.spoken).toBe(view.bubble.text);
  });

  it('shows a move played, marked with its class and what it did', () => {
    const view = viewAt({});

    expect(view.fen).toBe(REVIEW.moves[2].fenAfter);
    expect(view.lastMove).toEqual({ from: 'f1', to: 'a6' });
    expect(view.moveClass).toBe('blunder');
    expect(view.bubble).toMatchObject({
      title: 'Ba6 is a blunder',
      score: '-3.0',
    });
    expect(view.spoken).toMatch(/^bishop a6 is a blunder\. /);
    expect(view.arrows).toEqual([]);
  });

  it('shows the line that answers it, and its first move as an arrow', () => {
    const view = viewAt({ showLine: true });

    expect(view.bubble.line?.map((m) => m.san)).toEqual(['bxa6', 'Nf3']);
    expect(view.arrows).toEqual([{ from: 'b7', to: 'a6', kind: 'reply' }]);
  });

  it('marks the best move, when asked to every time', () => {
    expect(viewAt({ showBestMoves: true }).arrows).toEqual([
      { from: 'g1', to: 'f3', kind: 'best' },
    ]);
    // Not where the best move was played.
    expect(viewAt({ index: 3, showBestMoves: true }).arrows).toEqual([]);
  });

  it('plays the best move in its place', () => {
    const best = bestMoveOf(REVIEW.moves[2])!;
    const view = viewAt({ mode: { kind: 'best', best } });

    expect(view.fen).toBe(best.fenAfter);
    expect(view.moveClass).toBe('best');
    expect(view.bubble.title).toBe('Nf3 is best');
    expect(view.score).toEqual(REVIEW.moves[2].scoreBefore);
  });

  it('sets the position before the move to retry it, for its side', () => {
    const view = viewAt({ mode: { kind: 'retry', tried: null } });

    expect(view.fen).toBe(REVIEW.moves[2].fenBefore);
    expect(view.movableColor).toBe('w');
    expect(view.bubble.text).toBe('Find a better move for White.');
  });

  it('says how a move tried went', () => {
    const right = viewAt({
      mode: {
        kind: 'retry',
        tried: {
          uci: 'g1f3',
          san: 'Nf3',
          fenAfter: 'after',
          verdict: 'right',
        },
      },
    });
    expect(right).toMatchObject({ fen: 'after', movableColor: null });
    expect(right.bubble.text).toBe('Nf3 works. Well found!');
    expect(right.spoken).toBe('knight f3 works. Well found!');

    const wrong = viewAt({
      mode: {
        kind: 'retry',
        tried: { uci: 'a2a3', san: 'a3', fenAfter: 'after', verdict: 'wrong' },
      },
    });
    // Back to try again.
    expect(wrong.fen).toBe(REVIEW.moves[2].fenBefore);
    expect(wrong.movableColor).toBe('w');
  });

  it('closes on a theme to take away', () => {
    const view = viewAt({
      phase: 'done',
      index: 3,
      theme: { theme: 'tactics', title: 'Tactics', text: 'Watch for *forks*.' },
    });

    expect(view.bubble).toMatchObject({
      title: 'Tactics',
      text: 'Watch for *forks*.',
    });
    expect(view.spoken).toBe('Tactics. Watch for forks.');
  });
});
