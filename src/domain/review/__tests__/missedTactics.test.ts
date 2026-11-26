import { DEFAULT_POSITION } from 'chess.js';

import { buildReview } from '../buildReview';
import { missedTactics } from '../missedTactics';
import type { PositionEval } from '../types';

const at = (cp: number, pv: string[]): PositionEval => ({
  score: { kind: 'cp', cp },
  pv,
  second: null,
  depth: 14,
});

// 1. e4 d5 2. Nc3 dxe4 3. Nxe4 Qd5?? - black hangs the queen to 4. Nc3,
// which white misses with 4. d3?
const REVIEW = buildReview(
  DEFAULT_POSITION,
  ['e2e4', 'd7d5', 'b1c3', 'd5e4', 'c3e4', 'd8d5', 'd2d3'].map((uci) => ({
    uci,
  })),
  [
    at(30, ['e2e4']),
    at(30, ['d7d5']),
    at(40, ['b1c3']),
    at(40, ['d5e4']),
    at(40, ['c3e4']),
    at(30, ['d8d5']),
    at(900, ['e4c3', 'd5a5', 'f1c4', 'g8f6', 'g1f3', 'b8c6']),
    at(20, ['e7e5']),
  ],
);

describe('missedTactics', () => {
  it("makes a puzzle of a side's missed win: the position before, the line ending on its move", () => {
    const missed = missedTactics(REVIEW, 'w');

    expect(missed).toHaveLength(1);
    expect(missed[0]).toMatchObject({
      ply: 7,
      fen: REVIEW.moves[6].fenBefore,
      solution: ['e4c3', 'd5a5', 'f1c4', 'g8f6', 'g1f3'],
    });
    expect(missed[0].themes).toContain('advantage');
  });

  it("leaves the other side's moves out", () => {
    expect(missedTactics(REVIEW, 'b')).toEqual([]);
  });
});
