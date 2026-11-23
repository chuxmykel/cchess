import {
  BEST_WITHIN,
  BRILLIANT_AT_LEAST,
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
  // How many legal moves there were: one, and the move was forced.
  legalMoves: number;
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
  if (
    moveClass === 'book' ||
    moveClass === 'forced' ||
    input.isBest ||
    input.scoreLoss === null
  ) {
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
  // The only legal move: nothing to choose, so neither a find nor a slip -
  // however the game stands after it.
  if (input.legalMoves === 1) return 'forced';
  if (input.isBook) return 'book';
  if (input.isBest || loss < BEST_WITHIN) {
    // The best move there was other than this one: the engine's next best
    // for its own first choice, or else its first choice - its next best
    // line could be this move.
    const alternative = input.isBest ? input.winSecond : input.winBefore;
    // The only good move: the next best keeps the gap less, and the move
    // changes how the game stands - level where the next best loses, winning
    // where it's level - so a move winning anyway is never it.
    const onlyMove = (gap: number) =>
      alternative !== null &&
      input.winAfter - alternative >= gap &&
      standsBetter(standing(input.winAfter), standing(alternative));
    // Brilliant: a sound sacrifice that's the only good move, judged as for
    // strong players at every rating, not leaving the mover in a bad
    // position.
    if (
      input.isSacrifice &&
      onlyMove(ONLY_MOVE_GAP) &&
      input.winAfter >= BRILLIANT_AT_LEAST
    ) {
      return 'brilliant';
    }
    // Great: the only good move, as chess.com describes it - more generous to
    // newer players. Not an obvious recapture.
    const gap = toward(
      ONLY_MOVE_GAP,
      GENEROUS.onlyMoveGap,
      generosity(input.rating),
    );
    if (onlyMove(gap) && !input.isRecapture) return 'great';
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
