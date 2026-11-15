import type { MoveClass } from './types';

// How a move's class is judged: by how much of the mover's winning chances
// (0-100, see winChances) it gave away, as chess.com describes its own - 2,
// 5, 10 and 20 points marking excellent, good, inaccuracy and mistake from
// blunder.
export const CLASS_THRESHOLDS = {
  excellent: 2,
  good: 5,
  inaccuracy: 10,
  mistake: 20,
} as const;

// The only good move: the next best keeps this much less.
export const ONLY_MOVE_GAP = 15;

export type ClassifyInput = {
  // The engine's own first choice.
  isBest: boolean;
  // Still in the opening book, and every move before it too.
  isBook: boolean;
  // The mover's winning chances, 0-100: before the move, after it, and after
  // the next best move had it been played instead (null when there's no
  // other).
  winBefore: number;
  winAfter: number;
  winSecond: number | null;
  // The opponent's last move: how much it gave away.
  opponentLoss: number | null;
  // A piece given up, that the opponent can take for less than it's worth.
  isSacrifice: boolean;
  // Taking back on the square the opponent just took on - the obvious move.
  isRecapture: boolean;
};

export function classifyMove(input: ClassifyInput): MoveClass {
  const loss = Math.max(0, input.winBefore - input.winAfter);
  if (input.isBook) return 'book';
  if (input.isBest || loss < 0.5) {
    const onlyMove =
      input.winSecond !== null &&
      input.winBefore - input.winSecond >= ONLY_MOVE_GAP &&
      input.winAfter >= 30;
    if (onlyMove && input.isSacrifice && input.winBefore < 95) {
      return 'brilliant';
    }
    if (input.isSacrifice && input.winAfter >= 50 && input.winBefore < 90) {
      return 'brilliant';
    }
    if (onlyMove && !input.isRecapture) return 'great';
    return 'best';
  }
  if (loss < CLASS_THRESHOLDS.excellent) return 'excellent';
  if (loss < CLASS_THRESHOLDS.good) return 'good';
  // The opponent gave something away, and the move let it go - not losing,
  // but missing the chance.
  if (
    input.opponentLoss !== null &&
    input.opponentLoss >= CLASS_THRESHOLDS.inaccuracy &&
    loss >= CLASS_THRESHOLDS.inaccuracy &&
    input.winAfter >= 40
  ) {
    return 'miss';
  }
  if (loss < CLASS_THRESHOLDS.inaccuracy) return 'inaccuracy';
  if (loss < CLASS_THRESHOLDS.mistake) return 'mistake';
  return 'blunder';
}
