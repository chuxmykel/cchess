import { Color } from 'chess.js';

import { MARK_GLYPHS, type MarkGlyph, markOf } from './marks';
import { isEndgame, isOpening } from './themes';
import { type ReviewClock, timeLeftBefore, timeReport } from './time';
import type { GameReview, MoveFact } from './types';
import { winPercent } from './winChances';

// A side's review, boiled down to what's worth seeing across many games -
// kept with the review on the server, for a player's patterns.
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

export const DIGEST_VERSION = 1;

export type GameOutcome = 'white' | 'black' | 'draw' | null;

export type SideDigest = {
  v: typeof DIGEST_VERSION;
  accuracy: number;
  result: 'win' | 'loss' | 'draw' | null;
  opening: string | null;
  // Its own moves, and the tactics it missed - a win or a mate there.
  moves: number;
  missedTactics: number;
  slips: DigestSlip[];
  // Accuracy with time to spare, and when it ran short (time.ts).
  accuracyByClock: { plenty: number; short: number } | null;
  // Its average accuracy in each phase it played in.
  accuracyByPhase: Record<Phase, number | null>;
  // How many of its moves earned each mark.
  marks: Record<MarkGlyph, number>;
  // Its highest and lowest winning chances after the book, 0 to 100 - for
  // how often it won when winning and saved a lost position.
  chances: { high: number; low: number };
};

export type ReviewDigests = Record<Color, SideDigest>;

const round = (value: number) => Math.round(value * 10) / 10;
const average = (values: number[]) =>
  values.length === 0
    ? null
    : round(values.reduce((sum, value) => sum + value, 0) / values.length);

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
  const phaseAccuracy: Record<Phase, number[]> = {
    opening: [],
    middlegame: [],
    endgame: [],
  };
  const marks = Object.fromEntries(
    MARK_GLYPHS.map((glyph) => [glyph, 0]),
  ) as Record<MarkGlyph, number>;
  const lastBook = moves.findLastIndex((m) => m.moveClass === 'book');
  const chancesAfterBook = moves
    .slice(lastBook + 1)
    .map((m) => winPercent(m.scoreAfter, side));
  moves.forEach((move, index) => {
    if (move.color !== side) return;
    const phase: Phase = isOpening(moves, index)
      ? 'opening'
      : isEndgame(move.fenBefore)
        ? 'endgame'
        : 'middlegame';
    phaseAccuracy[phase].push(move.accuracy);
    if (
      move.moveClass === 'miss' ||
      move.facts.some((f) => f.kind === 'missesWin' || f.kind === 'missesMate')
    ) {
      missedTactics += 1;
    }
    const mark = markOf(move.moveClass);
    if (mark) marks[mark.glyph] += 1;
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
      phase,
      clockShare:
        left && clock && clock.initialMs > 0
          ? Math.round((left[index] / clock.initialMs) * 100) / 100
          : null,
    });
  });
  const report = clock ? timeReport(moves, clock, side) : null;
  return {
    v: DIGEST_VERSION,
    accuracy: side === 'w' ? review.white.accuracy : review.black.accuracy,
    result: resultFor(side, result),
    opening: review.opening?.name ?? null,
    moves: moves.filter((m) => m.color === side).length,
    missedTactics,
    slips,
    accuracyByClock: report?.lowTime ?? null,
    accuracyByPhase: {
      opening: average(phaseAccuracy.opening),
      middlegame: average(phaseAccuracy.middlegame),
      endgame: average(phaseAccuracy.endgame),
    },
    marks,
    chances: {
      high: round(Math.max(50, ...chancesAfterBook)),
      low: round(Math.min(50, ...chancesAfterBook)),
    },
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
