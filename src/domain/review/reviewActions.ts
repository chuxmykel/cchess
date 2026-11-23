import type { MoveClass, MoveFact, ReviewedMove } from './types';

// What a review offers at a move: Best only where there was a better move -
// not for a book move, a forced one or a brilliant one - and Show only where
// the line after it explains what's said - a slip and how it's punished, a
// standout move and why it works, a tactic and how it plays out - not after
// a quiet move, where it's only more moves.

const LINE_CLASSES: MoveClass[] = [
  'brilliant',
  'great',
  'inaccuracy',
  'mistake',
  'miss',
  'blunder',
];

const LINE_FACTS: MoveFact['kind'][] = [
  'forcesMate',
  'allowsMate',
  'missesMate',
  'hangs',
  'allowsFork',
  'allowsPin',
  'trapped',
  'losesMaterial',
  'missesWin',
  'sacrifice',
  'fork',
  'pin',
  'winsMaterial',
  'takesFree',
];

// Another move was better than the one played - not counting the book's,
// which are all good, a forced one's, the only move there was, or a
// brilliant one's.
export function hasBetterMove(move: ReviewedMove): boolean {
  return (
    move.moveClass !== 'book' &&
    move.moveClass !== 'forced' &&
    move.moveClass !== 'brilliant' &&
    !!move.bestLine[0] &&
    move.bestLine[0] !== move.uci
  );
}

// The line after the move is worth playing out.
export function lineWorthShowing(move: ReviewedMove): boolean {
  if (move.replyLine.length === 0) return false;
  return (
    LINE_CLASSES.includes(move.moveClass) ||
    move.facts.some((fact) => LINE_FACTS.includes(fact.kind))
  );
}
