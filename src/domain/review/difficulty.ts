import { HARD_FIND_GAP, ONLY_MOVE_GAP } from './thresholds';
import type { ReviewedMove } from './types';
import { winPercent } from './winChances';

// How hard a move was to find: an only move - every other gave a lot away -
// or a hard one; nothing to say of an easy one. Only a best move is rated,
// and never a forced move or a recapture, which find themselves.
export type Difficulty = 'only' | 'hard';

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  only: 'Only move',
  hard: 'Hard to find',
};

// How much more of the mover's winning chances the best move kept than the
// next best - null with no next best to compare with.
export function findGap(move: ReviewedMove): number | null {
  if (!move.secondScore) return null;
  return (
    winPercent(move.scoreBefore, move.color) -
    winPercent(move.secondScore, move.color)
  );
}

export function difficultyOf(move: ReviewedMove): Difficulty | null {
  const isBest = move.bestLine[0] === move.uci;
  if (!isBest || move.moveClass === 'forced' || move.isRecapture) return null;
  if (move.moveClass === 'book') return null;
  const gap = findGap(move);
  if (gap === null) return null;
  if (gap >= ONLY_MOVE_GAP) return 'only';
  if (gap >= HARD_FIND_GAP) return 'hard';
  return null;
}

// A side's hardest find: its best move with the widest gap, rated.
export function hardestFind(
  moves: ReviewedMove[],
  side: ReviewedMove['color'],
): { index: number; move: ReviewedMove; difficulty: Difficulty } | null {
  let best: {
    index: number;
    move: ReviewedMove;
    difficulty: Difficulty;
  } | null = null;
  moves.forEach((move, index) => {
    if (move.color !== side) return;
    const difficulty = difficultyOf(move);
    if (!difficulty) return;
    if (!best || (findGap(move) ?? 0) > (findGap(best.move) ?? 0)) {
      best = { index, move, difficulty };
    }
  });
  return best;
}
