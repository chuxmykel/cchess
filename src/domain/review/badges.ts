import { Color } from 'chess.js';

import { BADGES, STANDING } from './thresholds';
import type { GameReview } from './types';
import { winPercent } from './winChances';

// What a game earned a side, read off its review: how it went (the winning
// chances along the way, and the result) and how it was played.
export const BADGE_KINDS = [
  'swindle',
  'comeback',
  'heldDraw',
  'clean',
  'sacrifice',
] as const;

export type BadgeKind = (typeof BADGE_KINDS)[number];

export const BADGE_LABELS: Record<BadgeKind, string> = {
  swindle: 'Swindle',
  comeback: 'Comeback',
  heldDraw: 'Held the draw',
  clean: 'Clean game',
  sacrifice: 'Sacrifice that worked',
};

export const BADGE_DESCRIPTIONS: Record<BadgeKind, string> = {
  swindle: 'All but lost, and you got out of it.',
  comeback: 'Won from a losing position.',
  heldDraw: 'Drew from a losing position.',
  clean: 'No mistakes, and played accurately throughout.',
  sacrifice: 'Gave up material, and won.',
};

export type GameOutcome = 'white' | 'black' | 'draw' | null;

export function badgesOf(
  review: GameReview,
  side: Color,
  result: GameOutcome,
): BadgeKind[] {
  const mine = review.moves.filter((move) => move.color === side);
  const lowest = Math.min(
    ...review.moves.map((move) => winPercent(move.scoreAfter, side)),
    winPercent(review.scores[0] ?? { kind: 'cp', cp: 0 }, side),
  );
  const won = result === (side === 'w' ? 'white' : 'black');
  const drew = result === 'draw';
  const badges: BadgeKind[] = [];

  const swindle = lowest < BADGES.swindleBelow && (won || drew);
  if (swindle) badges.push('swindle');
  if (!swindle && lowest < STANDING.losing && won) badges.push('comeback');
  if (!swindle && lowest < STANDING.losing && drew) badges.push('heldDraw');

  const accuracy = side === 'w' ? review.white.accuracy : review.black.accuracy;
  const slipped = mine.some((move) =>
    ['mistake', 'miss', 'blunder'].includes(move.moveClass),
  );
  if (
    !slipped &&
    accuracy >= BADGES.cleanAccuracy &&
    mine.length >= BADGES.cleanMoves
  ) {
    badges.push('clean');
  }

  const sacrificed = mine.some(
    (move) =>
      move.moveClass === 'brilliant' ||
      move.facts.some((fact) => fact.kind === 'sacrifice'),
  );
  if (won && sacrificed) badges.push('sacrifice');
  return badges;
}
