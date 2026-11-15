import { Color } from 'chess.js';

import type { EngineScore } from '../evalScore';

// Lichess's winning-chances curve (see lichess-org/lila, WinPercent.scala):
// how likely a side is to win from an engine's score, fitted to its games.
const CURVE = 0.00368208;
// Scores past ten pawns change nothing - and a mate counts as that much, so a
// line that mates and one that's a rook up read alike, as lichess has it.
const CAP_CP = 1000;

// White's winning chances from -1 (lost) to 1 (won).
export function whiteWinningChances(score: EngineScore): number {
  const cp =
    score.kind === 'mate'
      ? score.winner === 'w'
        ? CAP_CP
        : -CAP_CP
      : Math.max(-CAP_CP, Math.min(CAP_CP, score.cp));
  return 2 / (1 + Math.exp(-CURVE * cp)) - 1;
}

// A side's chances of winning, 0 to 100.
export function winPercent(score: EngineScore, color: Color): number {
  const white = 50 + 50 * whiteWinningChances(score);
  return color === 'w' ? white : 100 - white;
}
