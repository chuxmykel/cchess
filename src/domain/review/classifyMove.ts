import {
  BEST_WITHIN,
  BRILLIANT,
  CLASS_THRESHOLDS,
  COMPLETELY_WINNING,
  GENEROUS,
  MATERIAL_MISTAKE,
  ONLY_MOVE_GAP,
  STANDING,
  UNRATED,
} from './thresholds';
import type { MoveClass } from './types';

// How a move's class is judged: by how much of the mover's winning chances
// (0-100, see winChances) it gave away, and where that leaves the mover -
// every bar in thresholds.ts.

// How generous, from 0 (rated GENEROUS.until and up) to 1 (GENEROUS.fully
// and below).
function generosity(rating: number | null): number {
  const at = rating ?? UNRATED;
  const share = (GENEROUS.until - at) / (GENEROUS.until - GENEROUS.fully);
  return Math.min(1, Math.max(0, share));
}

// A bar moved from its value for strong players toward its generous one.
const toward = (strong: number, generous: number, share: number) =>
  strong + (generous - strong) * share;

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
  // The mover's rating going into the game, or null when unrated.
  rating: number | null;
  // The opponent's last move: how much it gave away.
  opponentLoss: number | null;
  // A piece given up, that the opponent can take for less than it's worth.
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

// Where a side stands, worst first.
const STANDINGS = ['losing', 'level', 'winning'] as const;
type Standing = (typeof STANDINGS)[number];

function standing(win: number): Standing {
  if (win < STANDING.losing) return 'losing';
  return win < STANDING.winning ? 'level' : 'winning';
}

const standsBetter = (a: Standing, b: Standing) =>
  STANDINGS.indexOf(a) > STANDINGS.indexOf(b);

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
  if (input.isBest || loss < BEST_WITHIN) {
    const onlyGap =
      input.winSecond !== null &&
      input.winBefore - input.winSecond >= ONLY_MOVE_GAP &&
      input.winAfter >= BRILLIANT.onlyMoveAtLeast;
    if (
      onlyGap &&
      input.isSacrifice &&
      input.winBefore < BRILLIANT.onlyMoveUnlessBefore
    ) {
      return 'brilliant';
    }
    if (
      input.isSacrifice &&
      input.winAfter >= BRILLIANT.atLeast &&
      input.winBefore < BRILLIANT.unlessBefore
    ) {
      return 'brilliant';
    }
    // Great: the only good move, and one that changes how the game stands -
    // level where the next best loses, winning where it's level - as
    // chess.com describes it. Not an obvious recapture.
    const onlyMove =
      input.winSecond !== null &&
      input.winAfter - input.winSecond >=
        toward(ONLY_MOVE_GAP, GENEROUS.onlyMoveGap, generosity(input.rating)) &&
      standsBetter(standing(input.winAfter), standing(input.winSecond));
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
    standing(input.winBefore) === 'winning' &&
    standing(input.winAfter) === 'level'
  ) {
    return 'miss';
  }
  if (loss < CLASS_THRESHOLDS.inaccuracy) return 'inaccuracy';
  if (loss < CLASS_THRESHOLDS.mistake) return 'mistake';
  return 'blunder';
}
