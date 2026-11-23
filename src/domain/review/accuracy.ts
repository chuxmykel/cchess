import { Color } from 'chess.js';

import type { EngineScore } from '../evalScore';
import { winPercent } from './winChances';

// Lichess's accuracy (see lichess-org/lila, AccuracyPercent.scala), open and
// documented at lichess.org/page/accuracy: a move's accuracy from the winning
// chances it gave away, and a game's from its moves', weighted by how sharp
// the game was around each.

// Lichess's fitted curve from winning chances given away to a move's
// accuracy, and the point it adds for an engine that doesn't see everything.
const MOVE_CURVE = {
  scale: 103.1668100711649,
  decay: 0.04354415386753951,
  offset: 3.166924740191411,
  allowance: 1,
} as const;

// How many positions around a move its weight is measured over: a tenth of
// the game's moves, held between these.
const WINDOW = { movesPer: 10, min: 2, max: 8 } as const;
// A move's weight, the swing of the chances around it, held between these.
const WEIGHT = { min: 0.5, max: 12 } as const;

// A move's accuracy, 0 to 100, from the mover's winning chances before and
// after it.
export function moveAccuracy(winBefore: number, winAfter: number): number {
  if (winAfter >= winBefore) return 100;
  const raw =
    MOVE_CURVE.scale * Math.exp(-MOVE_CURVE.decay * (winBefore - winAfter)) -
    MOVE_CURVE.offset;
  return Math.max(0, Math.min(100, raw + MOVE_CURVE.allowance));
}

function standardDeviation(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function harmonicMean(values: number[]): number {
  return values.length / values.reduce((sum, v) => sum + 1 / Math.max(1, v), 0);
}

// Each side's accuracy over a game, from the score of every position, the
// start first - null for a side that made no move.
export function gameAccuracy(
  scores: EngineScore[],
  firstToMove: Color = 'w',
): Record<Color, number | null> {
  const wins = scores.map((score) => winPercent(score, 'w'));
  const moves = wins.length - 1;
  if (moves < 1) return { w: null, b: null };
  // Each move weighed by how much the chances swung in the moves around it -
  // a slip in a sharp game counts for less than one in a quiet game.
  const size = Math.max(
    WINDOW.min,
    Math.min(WINDOW.max, Math.floor(moves / WINDOW.movesPer)),
  );
  const windows: number[][] = [];
  // As lichess pads the start: the first window again, size - 2 times.
  for (let i = 0; i < Math.min(size - 2, wins.length); i++) {
    windows.push(wins.slice(0, size));
  }
  for (let i = 0; i + size <= wins.length; i++) {
    windows.push(wins.slice(i, i + size));
  }
  const bySide: Record<Color, { accuracy: number; weight: number }[]> = {
    w: [],
    b: [],
  };
  for (let i = 0; i < moves; i++) {
    const color: Color = (i % 2 === 0) === (firstToMove === 'w') ? 'w' : 'b';
    const before = color === 'w' ? wins[i] : 100 - wins[i];
    const after = color === 'w' ? wins[i + 1] : 100 - wins[i + 1];
    const window = windows[i] ?? windows[windows.length - 1];
    const weight = Math.max(
      WEIGHT.min,
      Math.min(WEIGHT.max, standardDeviation(window)),
    );
    bySide[color].push({ accuracy: moveAccuracy(before, after), weight });
  }
  const sideAccuracy = (
    moved: { accuracy: number; weight: number }[],
  ): number | null => {
    if (moved.length === 0) return null;
    const totalWeight = moved.reduce((sum, m) => sum + m.weight, 0);
    const weighted =
      moved.reduce((sum, m) => sum + m.accuracy * m.weight, 0) / totalWeight;
    const harmonic = harmonicMean(moved.map((m) => m.accuracy));
    return (weighted + harmonic) / 2;
  };
  return { w: sideAccuracy(bySide.w), b: sideAccuracy(bySide.b) };
}
