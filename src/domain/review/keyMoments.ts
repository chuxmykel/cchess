import { Color } from 'chess.js';

import { type MoveClass, type ReviewedMove, SLIP_CLASSES } from './types';

// The moves worth stopping at, for the side reviewed: its standout moves and
// its slips - and where the book ran out.
const KEY_CLASSES: readonly MoveClass[] = [
  'brilliant',
  'great',
  ...SLIP_CLASSES,
];

// The indexes (into the review's moves) that Next steps between, in order.
export function keyMoments(moves: ReviewedMove[], side: Color): number[] {
  const moments = new Set<number>();
  const lastBook = moves.findLastIndex((m) => m.moveClass === 'book');
  if (lastBook >= 0) moments.add(lastBook);
  moves.forEach((move, index) => {
    if (move.color === side && KEY_CLASSES.includes(move.moveClass)) {
      moments.add(index);
    }
  });
  return [...moments].sort((a, b) => a - b);
}

// The key moment after a move - or, with none left, null.
export function nextKeyMoment(moments: number[], index: number): number | null {
  return moments.find((m) => m > index) ?? null;
}
