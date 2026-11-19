// The games the harness reviews, and what each reference says of them.
import { join } from 'node:path';
import type { Color } from 'chess.js';

import type { PositionEval } from '../../src/domain/review/types';

// Everything the harness keeps: the user's games and the evals worked out
// of them - kept out of git (.gitignore).
export const DATA_DIR = join(__dirname, '..', '..', '.review-harness');

export type HarnessGame = {
  id: string;
  source: 'chesscom' | 'lichess';
  url: string;
  timeClass: string;
  startFen: string;
  uciMoves: string[];
  // Each side's rating going into the game, on its own site's scale.
  ratings: Record<Color, number | null>;
  result: 'white' | 'black' | 'draw' | null;
  // What the site's own review said: each side's accuracy, and for lichess,
  // its judgement of each move (by index into uciMoves).
  reference: {
    accuracy?: Record<Color, number>;
    judgements?: Record<number, 'inaccuracy' | 'mistake' | 'blunder'>;
  };
};

export type EvaluatedGame = HarnessGame & {
  engine: string;
  strength: string;
  // One per position, the start first.
  evals: PositionEval[];
};

// A shuffle that's the same every run, so a sample is too.
export function seededShuffle<T>(items: T[], seed = 1): T[] {
  const copy = [...items];
  let state = seed;
  const next = () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
