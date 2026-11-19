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

// Where a side stands by its winning chances: losing under the first,
// winning from the second, level between.
export const STANDING = { losing: 35, winning: 65 } as const;

// Completely winning: from here, what's given away hardly matters.
export const COMPLETELY_WINNING = 80;

// Winning chances barely move once a game is all but lost, so a piece thrown
// away there would read as a good move: a move giving up this much material
// over best play - and this much of the score - is a mistake whatever the
// chances. Not while the mover is still completely winning after it, where
// chess.com and lichess call it fine too.
export const MATERIAL_MISTAKE = { pawns: 3, centipawns: 80 } as const;

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
  // A piece given up for good, or offered and turned down (sacrificeOf).
  isSacrifice: boolean;
  // Taking back on the square the opponent just took on - the obvious move.
  isRecapture: boolean;
  // How much material the move gives up over best play, in pawns, and how
  // much of the score, in centipawns - null when a mate's in it.
  materialLoss: number;
  scoreLoss: number | null;
};

const ORDER = [
  'brilliant',
  'great',
  'best',
  'excellent',
  'good',
  'inaccuracy',
  'mistake',
  'blunder',
] as const;

// The worse of two classes.
function atLeast(moveClass: MoveClass, floor: MoveClass): MoveClass {
  const index = ORDER.indexOf(moveClass as (typeof ORDER)[number]);
  const floorIndex = ORDER.indexOf(floor as (typeof ORDER)[number]);
  return index < 0 || index >= floorIndex ? moveClass : floor;
}

// Losing, level or winning, as 0, 1 or 2.
function standing(win: number): number {
  if (win < STANDING.losing) return 0;
  return win < STANDING.winning ? 1 : 2;
}

export function classifyMove(input: ClassifyInput): MoveClass {
  const moveClass = byWinChances(input);
  if (moveClass === 'book' || input.isBest || input.scoreLoss === null) {
    return moveClass;
  }
  if (
    input.materialLoss >= MATERIAL_MISTAKE.pawns &&
    input.scoreLoss >= MATERIAL_MISTAKE.centipawns &&
    input.winAfter < COMPLETELY_WINNING
  ) {
    return atLeast(moveClass, 'mistake');
  }
  return moveClass;
}

function byWinChances(input: ClassifyInput): MoveClass {
  const loss = Math.max(0, input.winBefore - input.winAfter);
  if (input.isBook) return 'book';
  if (input.isBest || loss < 0.5) {
    const onlyGap =
      input.winSecond !== null &&
      input.winBefore - input.winSecond >= ONLY_MOVE_GAP &&
      input.winAfter >= 30;
    if (onlyGap && input.isSacrifice && input.winBefore < 95) {
      return 'brilliant';
    }
    if (input.isSacrifice && input.winAfter >= 50 && input.winBefore < 90) {
      return 'brilliant';
    }
    // Great: the only good move, and one that changes how the game stands -
    // level where the next best loses, winning where it's level - as
    // chess.com describes it. Not an obvious recapture.
    const onlyMove =
      input.winSecond !== null &&
      input.winAfter - input.winSecond >= ONLY_MOVE_GAP &&
      standing(input.winAfter) > standing(input.winSecond);
    if (onlyMove && !input.isRecapture) return 'great';
    return 'best';
  }
  if (loss < CLASS_THRESHOLDS.excellent) return 'excellent';
  if (loss < CLASS_THRESHOLDS.good) return 'good';
  // The opponent's slip left a winning position there for the taking, and
  // the move let it go - not winning after it, but not losing either.
  if (
    input.opponentLoss !== null &&
    input.opponentLoss >= CLASS_THRESHOLDS.inaccuracy &&
    loss >= CLASS_THRESHOLDS.inaccuracy &&
    standing(input.winBefore) === 2 &&
    standing(input.winAfter) === 1
  ) {
    return 'miss';
  }
  if (loss < CLASS_THRESHOLDS.inaccuracy) return 'inaccuracy';
  if (loss < CLASS_THRESHOLDS.mistake) return 'mistake';
  return 'blunder';
}
