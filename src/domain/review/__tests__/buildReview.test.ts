import { DEFAULT_POSITION } from 'chess.js';

import { EngineScore } from '../../evalScore';
import { bestMoveOf, buildReview } from '../buildReview';
import { keyMoments, nextKeyMoment } from '../keyMoments';
import { themeCards } from '../themes';
import { PositionEval } from '../types';

const cp = (value: number): EngineScore => ({ kind: 'cp', cp: value });
const at = (score: EngineScore, pv: string[], second?: EngineScore) => ({
  score,
  pv,
  second: second ?? null,
  depth: 14,
});

// 1. e4 e5 2. Ba6?? bxa6
const moves = ['e2e4', 'e7e5', 'f1a6', 'b7a6'].map((uci) => ({ uci }));
const evals: PositionEval[] = [
  at(cp(20), ['e2e4', 'e7e5']),
  at(cp(30), ['e7e5', 'g1f3']),
  at(cp(30), ['g1f3', 'b8c6']),
  at(cp(-300), ['b7a6', 'g1f3']),
  at(cp(-300), ['g1f3', 'd7d6']),
];

describe('buildReview', () => {
  const review = buildReview(DEFAULT_POSITION, moves, evals, 'game');

  it('reviews every move', () => {
    expect(review.moves.map((m) => [m.ply, m.san, m.moveClass])).toEqual([
      [1, 'e4', 'book'],
      [2, 'e5', 'book'],
      [3, 'Ba6', 'blunder'],
      [4, 'bxa6', 'best'],
    ]);
  });

  it('says what a move did', () => {
    expect(review.moves[2].facts[0]).toEqual({
      kind: 'hangs',
      piece: 'bishop',
    });
    expect(review.moves[2].comment.text).toMatch(/bishop/);
    expect(review.moves[3].facts[0]).toEqual({
      kind: 'takesFree',
      piece: 'bishop',
    });
  });

  it('keeps the best move and the line answering the move', () => {
    expect(review.moves[2].bestSan).toBe('Nf3');
    expect(review.moves[2].replyLine).toEqual(['b7a6', 'g1f3']);
  });

  it('counts each side’s classes and accuracy', () => {
    expect(review.white.counts.blunder).toBe(1);
    expect(review.white.counts.book).toBe(1);
    expect(review.black.counts.best).toBe(1);
    expect(review.white.accuracy).toBeLessThan(review.black.accuracy);
    expect(review.white.rating).toBeLessThan(review.black.rating);
  });

  it('names the opening and keeps every score', () => {
    expect(review.opening?.name).toMatch(/^King's/);
    expect(review.scores).toHaveLength(5);
    expect(review.depth).toBe(14);
  });

  it('needs an eval for every position', () => {
    expect(() =>
      buildReview(DEFAULT_POSITION, moves, evals.slice(1)),
    ).toThrow();
  });

  it('numbers moves on from a set-up position', () => {
    const fen = '4k3/8/8/8/8/8/4P3/4K3 b - - 0 12';
    const setUp = buildReview(
      fen,
      [{ uci: 'e8d7' }],
      [at(cp(400), ['e8d7']), at(cp(400), ['e2e4'])],
    );
    expect(setUp.moves[0].ply).toBe(24);
    expect(setUp.moves[0].color).toBe('b');
  });

  it('stops at the key moments of the side reviewed', () => {
    const moments = keyMoments(review.moves, 'w');
    // The last book move, then white's blunder.
    expect(moments).toEqual([1, 2]);
    expect(nextKeyMoment(moments, -1)).toBe(1);
    expect(nextKeyMoment(moments, 2)).toBeNull();
  });

  it('closes on what to take from the game', () => {
    const cards = themeCards(review, 'w');
    expect(cards.map((c) => c.theme)).toEqual(['opening', 'tactics']);
    expect(cards[1].text).toMatch(/pieces left \*hanging\*/);
  });

  it('anchors each side’s game rating on its rating', () => {
    const rated = buildReview(DEFAULT_POSITION, moves, evals, 'game', {
      w: 2400,
      b: null,
    });
    expect(rated.white.rating).toBeGreaterThan(review.white.rating);
    expect(rated.black.rating).toBe(review.black.rating);
  });

  it('says what the best move would have done', () => {
    const best = bestMoveOf(review.moves[2], 'game');
    expect(best).toMatchObject({ san: 'Nf3', uci: 'g1f3' });
    expect(best!.facts).toContainEqual({ kind: 'develops', piece: 'knight' });
    expect(best!.comment.spoken).toMatch(/^knight f3 is best\./);
  });

  it('has no best move once the game is over', () => {
    expect(bestMoveOf({ ...review.moves[2], bestLine: [] })).toBeNull();
  });
});
