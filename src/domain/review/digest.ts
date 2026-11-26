import { Color } from 'chess.js';

import { type BadgeKind, badgesOf, type GameOutcome } from './badges';
import { markOf } from './marks';
import { isEndgame, isOpening } from './themes';
import { type ReviewClock, timeLeftBefore, timeReport } from './time';
import type { GameReview, MoveFact } from './types';

// A side's review, boiled down to what's worth seeing across many games -
// kept with the review on the server, for a player's patterns and badges.
// Worked out here, where reviews are built; versioned, so a later shape
// can tell an old one apart.
export type Phase = 'opening' | 'middlegame' | 'endgame';

export type DigestSlip = {
  ply: number;
  mark: '?!' | '?' | '??';
  facts: MoveFact['kind'][];
  phase: Phase;
  // The share of its starting time the side had left - null without a clock.
  clockShare: number | null;
};

export type SideDigest = {
  v: 1;
  accuracy: number;
  result: 'win' | 'loss' | 'draw' | null;
  opening: string | null;
  // Its own moves, and the tactics it missed - a win or a mate there.
  moves: number;
  missedTactics: number;
  slips: DigestSlip[];
  // Accuracy with time to spare, and when it ran short (time.ts).
  accuracyByClock: { plenty: number; short: number } | null;
  badges: BadgeKind[];
};

export type ReviewDigests = Record<Color, SideDigest>;

function resultFor(side: Color, result: GameOutcome): SideDigest['result'] {
  if (result === null) return null;
  if (result === 'draw') return 'draw';
  return result === (side === 'w' ? 'white' : 'black') ? 'win' : 'loss';
}

export function sideDigest(
  review: GameReview,
  side: Color,
  result: GameOutcome,
  clock: ReviewClock | null,
): SideDigest {
  const { moves } = review;
  const left = clock
    ? timeLeftBefore(
        clock,
        moves.map((m) => m.color),
      )
    : null;
  const slips: DigestSlip[] = [];
  let missedTactics = 0;
  moves.forEach((move, index) => {
    if (move.color !== side) return;
    if (
      move.moveClass === 'miss' ||
      move.facts.some((f) => f.kind === 'missesWin' || f.kind === 'missesMate')
    ) {
      missedTactics += 1;
    }
    const mark = markOf(move.moveClass);
    if (
      !mark ||
      (mark.glyph !== '?!' && mark.glyph !== '?' && mark.glyph !== '??')
    ) {
      return;
    }
    slips.push({
      ply: move.ply,
      mark: mark.glyph,
      facts: move.facts.map((f) => f.kind),
      phase: isOpening(moves, index)
        ? 'opening'
        : isEndgame(move.fenBefore)
          ? 'endgame'
          : 'middlegame',
      clockShare:
        left && clock && clock.initialMs > 0
          ? Math.round((left[index] / clock.initialMs) * 100) / 100
          : null,
    });
  });
  const report = clock ? timeReport(moves, clock, side) : null;
  return {
    v: 1,
    accuracy: side === 'w' ? review.white.accuracy : review.black.accuracy,
    result: resultFor(side, result),
    opening: review.opening?.name ?? null,
    moves: moves.filter((m) => m.color === side).length,
    missedTactics,
    slips,
    accuracyByClock: report?.lowTime ?? null,
    badges: badgesOf(review, side, result),
  };
}

export function reviewDigests(
  review: GameReview,
  result: GameOutcome,
  clock: ReviewClock | null,
): ReviewDigests {
  return {
    w: sideDigest(review, 'w', result, clock),
    b: sideDigest(review, 'b', result, clock),
  };
}
