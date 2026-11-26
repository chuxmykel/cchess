import { DEFAULT_POSITION } from 'chess.js';

import { bestMoveOf, buildReview } from '../../domain/review/buildReview';
import type { PositionEval } from '../../domain/review/types';
import { reviewView, ReviewViewInput } from '../reviewView';
import { makeReview, makeReviewedMove } from '../../testUtils/reviewedMove';

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
    line: null,
    lineStep: null,
    showBestMoves: false,
    theme: null,
    intro: "Nice win! Let's see how you *got* there.",
    ...input,
  });

describe('reviewView', () => {
  it('starts on the starting position, with the opening words', () => {
    const view = viewAt({ index: -1, phase: 'summary' });

    expect(view.fen).toBe(DEFAULT_POSITION);
    expect(view.lastMove).toBeNull();
    expect(view.bubble.text).toBe("Nice win! Let's see how you *got* there.");
    expect(view.spoken).toBe("Nice win! Let's see how you got there.");
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

  it('plays out the line that answers it, a move at a time', () => {
    const move = REVIEW.moves[2];
    const line = { fen: move.fenAfter, moves: move.replyLine };
    const first = viewAt({ line, lineStep: 1 });

    // bxa6 on the board, its class's mark gone.
    expect(first.lastMove).toEqual({ from: 'b7', to: 'a6' });
    expect(first.moveClass).toBeNull();
    expect(first.bubble.line?.map((m) => m.san)).toEqual(['bxa6', 'Nf3']);
    expect(first.bubble.lineAt).toBe(0);

    const second = viewAt({ line, lineStep: 2 });
    expect(second.lastMove).toEqual({ from: 'g1', to: 'f3' });
    expect(second.bubble.lineAt).toBe(1);

    // Hidden: the move played again.
    expect(viewAt({ line, lineStep: null }).fen).toBe(move.fenAfter);
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
      theme: {
        theme: 'tactics',
        title: 'Tactics',
        text: 'Watch for *forks*.',
      },
    });

    expect(view.bubble).toMatchObject({
      title: 'Tactics',
      text: 'Watch for *forks*.',
    });
    expect(view.spoken).toBe('Tactics. Watch for forks.');
  });

  describe('in the cchess style', () => {
    const names = { w: 'Ann', b: 'Bo' };

    it('marks a slip with its symbol and says it in words, with the time taken', () => {
      const view = viewAt({ style: 'cchess', names, timeSpent: '4.2s' });

      expect(view.moveClass).toBe('blunder');
      expect(view.bubble).toMatchObject({
        moveClass: 'blunder',
        title: 'Ba6?? · Blunder',
        score: '-3.0 · 4.2s',
      });
      expect(view.spoken).toMatch(/^bishop a6: blunder\. /i);
    });

    it("shows the opponent's idea at the side's slip, dashed", () => {
      const view = viewAt({ style: 'cchess', names, side: 'w' });

      expect(view.arrows).toContainEqual({
        from: 'b7',
        to: 'a6',
        kind: 'threat',
      });
      expect(view.bubble.text).toMatch(/Their idea: bxa6\.$/);
      expect(view.spoken).toMatch(/Their idea: b takes a6\.$/);
    });

    it("shows no idea at the other side's move, nor in the classic style", () => {
      expect(
        viewAt({ style: 'cchess', names, side: 'b' }).arrows,
      ).not.toContainEqual(expect.objectContaining({ kind: 'threat' }));
      expect(viewAt({ side: 'w' }).arrows).toEqual([]);
    });

    it("tags the side's only move, and says so of a guess that found it", () => {
      const only = makeReview([
        makeReviewedMove(0, { best: true, before: 0, second: -400 }),
      ]);
      const at = (mode: ReviewViewInput['mode']) =>
        reviewView({
          review: only,
          phase: 'stepping',
          index: 0,
          mode,
          line: null,
          lineStep: null,
          showBestMoves: false,
          theme: null,
          intro: '',
          style: 'cchess',
          side: 'w',
          names,
        });

      expect(at({ kind: 'move' }).bubble.tag).toBe('Only move');
      expect(
        at({
          kind: 'guess',
          tried: {
            uci: 'e2e4',
            san: 'e4',
            fenAfter: only.moves[0].fenAfter,
            verdict: 'right',
          },
        }).bubble.text,
      ).toMatch(/only move/);
    });

    it('leaves a move with no mark unmarked', () => {
      // 1... e5, from the book.
      const view = viewAt({ style: 'cchess', names, index: 1 });

      expect(view.moveClass).toBeNull();
      expect(view.bubble).toMatchObject({
        moveClass: null,
        title: 'e5 · Book move',
      });
    });

    it('asks for the move, on the position before it', () => {
      const view = viewAt({
        style: 'cchess',
        names,
        mode: { kind: 'guess', tried: null },
      });

      expect(view.fen).toBe(REVIEW.moves[2].fenBefore);
      expect(view.movableColor).toBe('w');
      expect(view.bubble).toMatchObject({
        title: 'Your move',
        text: 'Move 2 for Ann: what would you play?',
      });
    });

    it('shows a guess found on the board, asking no more', () => {
      const view = viewAt({
        style: 'cchess',
        names,
        mode: {
          kind: 'guess',
          tried: {
            uci: 'g1f3',
            san: 'Nf3',
            fenAfter: REVIEW.moves[2].fenBefore,
            verdict: 'right',
          },
        },
      });

      expect(view.movableColor).toBeNull();
      expect(view.lastMove).toEqual({ from: 'g1', to: 'f3' });
      expect(view.bubble.text).toBe('Nf3 works. Well found!');
    });
  });
});
