import { Chess, Color } from 'chess.js';

// A puzzle to solve, from either deck: where it starts, the opponent's move
// that sets it (a lichess puzzle's first; none for one of your own), and
// the line that solves it - the solver's move first, then the reply, and
// so on.
export type SolvablePuzzle = {
  kind: 'pool' | 'mine';
  id: string;
  fen: string;
  setup: string | null;
  solution: string[];
  themes: string[];
  // A pool puzzle's own rating.
  rating: number | null;
};

// A lichess puzzle as the server sends it: the opponent's move first.
export type PoolPuzzleData = {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  themes: string[];
};

// One of your own: you to move, the line that wins.
export type PersonalPuzzleData = {
  id: string;
  fen: string;
  solution: string[];
  themes: string[];
};

export function fromPool(puzzle: PoolPuzzleData): SolvablePuzzle {
  const [setup, ...solution] = puzzle.moves;
  return {
    kind: 'pool',
    id: puzzle.id,
    fen: puzzle.fen,
    setup,
    solution,
    themes: puzzle.themes,
    rating: puzzle.rating,
  };
}

export function fromMine(puzzle: PersonalPuzzleData): SolvablePuzzle {
  return {
    kind: 'mine',
    id: puzzle.id,
    fen: puzzle.fen,
    setup: null,
    solution: puzzle.solution,
    themes: puzzle.themes,
    rating: null,
  };
}

// A move played on a position, as chess.js has it - null when illegal.
export function play(
  fen: string,
  uci: string,
): { fen: string; san: string; mate: boolean } | null {
  const chess = new Chess(fen);
  try {
    const move = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci[4],
    });
    return { fen: move.after, san: move.san, mate: chess.isCheckmate() };
  } catch {
    return null;
  }
}

// The position the solver starts from: after the setting move, if any.
export function startOf(puzzle: SolvablePuzzle): string {
  return puzzle.setup
    ? (play(puzzle.fen, puzzle.setup)?.fen ?? puzzle.fen)
    : puzzle.fen;
}

export function solverColor(puzzle: SolvablePuzzle): Color {
  return startOf(puzzle).split(' ')[1] as Color;
}

// Whether a move the solver tried, at a point in the solution, solves it:
// the solution's own move - or, where that mates, any mate.
export function isRight(
  puzzle: SolvablePuzzle,
  fen: string,
  at: number,
  uci: string,
): boolean {
  const expected = puzzle.solution[at];
  if (!expected) return false;
  if (uci === expected) return true;
  const tried = play(fen, uci);
  return !!tried?.mate && !!play(fen, expected)?.mate;
}

// "White to move", for the prompt.
export function solverName(puzzle: SolvablePuzzle): string {
  return solverColor(puzzle) === 'w' ? 'White' : 'Black';
}
