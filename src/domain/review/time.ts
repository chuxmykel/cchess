import { Color } from 'chess.js';

import { TIME } from './thresholds';
import type { ReviewedMove } from './types';

// A live game's clock, as the server records it: each side's starting
// time, the increment, and the mover's time left after each move.
export type ReviewClock = {
  initialMs: number;
  incrementMs: number;
  afterMs: number[];
};

// How long each move took: the mover's time before it, its increment
// added, less its time after - never below nothing. A side's first move
// doesn't start its clock, so it took none.
export function moveTimes(clock: ReviewClock, colors: Color[]): number[] {
  const left: Record<Color, number | null> = { w: null, b: null };
  return colors.map((color, index) => {
    const before = left[color];
    const after = clock.afterMs[index] ?? before ?? clock.initialMs;
    left[color] = after;
    if (before === null) return 0;
    return Math.max(0, before + clock.incrementMs - after);
  });
}

// The mover's time left before each move.
export function timeLeftBefore(clock: ReviewClock, colors: Color[]): number[] {
  const left: Record<Color, number> = {
    w: clock.initialMs,
    b: clock.initialMs,
  };
  return colors.map((color, index) => {
    const before = left[color];
    left[color] = clock.afterMs[index] ?? before;
    return before;
  });
}

export type TimeReport = {
  // The side's longest think.
  longest: { index: number; move: ReviewedMove; ms: number } | null;
  // Its fastest slip, when played in a hurry.
  hastySlip: { index: number; move: ReviewedMove; ms: number } | null;
  // Its accuracy with time to spare, and with little left - when it made
  // enough moves either way to say.
  lowTime: { plenty: number; short: number } | null;
};

const average = (values: number[]) =>
  values.reduce((sum, v) => sum + v, 0) / values.length;

export function timeReport(
  moves: ReviewedMove[],
  clock: ReviewClock,
  side: Color,
): TimeReport {
  const colors = moves.map((m) => m.color);
  const times = moveTimes(clock, colors);
  const leftBefore = timeLeftBefore(clock, colors);
  const mine = moves
    .map((move, index) => ({ move, index, ms: times[index] }))
    .filter(({ move }) => move.color === side);

  const longest = mine.reduce<(typeof mine)[number] | null>(
    (best, m) => (m.ms > 0 && (!best || m.ms > best.ms) ? m : best),
    null,
  );
  const hasty = mine
    .filter(
      ({ move, ms }) =>
        (move.moveClass === 'mistake' ||
          move.moveClass === 'miss' ||
          move.moveClass === 'blunder') &&
        ms < TIME.hastySlipMs,
    )
    .sort((a, b) => a.ms - b.ms)[0];

  const short = mine.filter(
    ({ index }) => leftBefore[index] < clock.initialMs * TIME.lowTimeShare,
  );
  const plenty = mine.filter(
    ({ index }) => leftBefore[index] >= clock.initialMs * TIME.lowTimeShare,
  );
  const lowTime =
    short.length >= TIME.lowTimeMoves && plenty.length >= TIME.lowTimeMoves
      ? {
          plenty: average(plenty.map(({ move }) => move.accuracy)),
          short: average(short.map(({ move }) => move.accuracy)),
        }
      : null;

  return {
    longest: longest ?? null,
    hastySlip: hasty ?? null,
    lowTime,
  };
}

// The moves the clock calls out, by index: the longest think, and a slip
// played in a hurry.
export function calledOut(report: TimeReport): {
  slow: number | null;
  hasty: number | null;
} {
  return {
    slow: report.longest?.index ?? null,
    hasty: report.hastySlip?.index ?? null,
  };
}
