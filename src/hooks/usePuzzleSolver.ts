import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess, Color, Square } from 'chess.js';

import {
  PUZZLE_REPLY_MS,
  PUZZLE_SETUP_MS,
  PUZZLE_SOLUTION_STEP_MS,
} from '../constants/puzzles';
import {
  isRight,
  play,
  type SolvablePuzzle,
  solverColor,
  startOf,
} from '../domain/puzzles/puzzle';
import type { MoveSquares } from '../domain/types';

// Where a puzzle is: the opponent's setting move about to be played, the
// solver to find a move, solved, or missed.
export type PuzzleStatus = 'setting' | 'playing' | 'solved' | 'failed';

export type PuzzleSteps = {
  back: () => void;
  forward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
};

export type PuzzleSolver = {
  status: PuzzleStatus;
  // The position shown - the latest, or an earlier one stepped back to.
  fen: string;
  lastMove: MoveSquares | null;
  // Whether the latest position is the one shown: moves are played only
  // there.
  isLive: boolean;
  solver: Color;
  // The move missed with, in SAN - null until one is.
  wrongMove: string | null;
  // The solution being played out, once asked for.
  showingSolution: boolean;
  // The next move of the solution, while a hint shows it.
  hint: MoveSquares | null;
  // A hint was taken: the puzzle counts as missed, solved or not.
  hinted: boolean;
  canHint: boolean;
  tryMove: (from: Square, to: Square) => void;
  showHint: () => void;
  showSolution: () => void;
  retry: () => void;
  // Stepping through the positions played so far.
  steps: PuzzleSteps;
};

type Position = { fen: string; lastMove: MoveSquares | null };

const squaresOf = (uci: string): MoveSquares => ({
  from: uci.slice(0, 2) as Square,
  to: uci.slice(2, 4) as Square,
});

// A move tried on the board, as UCI - a pawn to its last rank a queen.
function uciOf(fen: string, from: Square, to: Square): string | null {
  try {
    const move = new Chess(fen).move({ from, to, promotion: 'q' });
    return move.lan;
  } catch {
    return null;
  }
}

const startPositions = (puzzle: SolvablePuzzle): Position[] => [
  { fen: puzzle.fen, lastMove: null },
];

// Solving a puzzle: the opponent's setting move played a moment after it's
// shown, then each of the solver's moves judged - the solution's, or any
// mate where it mates - and answered with the solution's reply, until the
// line's done (solved) or a move's wrong (missed). A hint shows the next
// move, and counts the puzzle as missed. `onResult` hears the first result
// of each puzzle, once; the solution can then be shown, or the puzzle tried
// again. Every position played is kept, to step back through.
export function usePuzzleSolver(
  puzzle: SolvablePuzzle | null,
  onResult?: (solved: boolean) => void,
): PuzzleSolver {
  const [positions, setPositions] = useState<Position[]>(() =>
    puzzle ? startPositions(puzzle) : [{ fen: '', lastMove: null }],
  );
  // An earlier position stepped back to; null for the latest.
  const [viewing, setViewing] = useState<number | null>(null);
  const [status, setStatus] = useState<PuzzleStatus>('setting');
  // The solution's next move: the solver's while playing.
  const [at, setAt] = useState(0);
  const [wrongMove, setWrongMove] = useState<string | null>(null);
  const [showingSolution, setShowingSolution] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [hinted, setHinted] = useState(false);
  const reported = useRef<string | null>(null);
  // The opponent's reply on its way, dropped if the puzzle moves on first.
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropReply = useCallback(() => {
    if (replyTimer.current) clearTimeout(replyTimer.current);
    replyTimer.current = null;
  }, []);
  useEffect(() => dropReply, [puzzle, dropReply]);
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  });

  const report = useCallback(
    (solved: boolean) => {
      if (!puzzle || reported.current === puzzle.id) return;
      reported.current = puzzle.id;
      onResultRef.current?.(solved);
    },
    [puzzle],
  );

  // A move played on: the latest position, shown.
  const push = useCallback((fen: string, uci: string) => {
    setPositions((current) => [...current, { fen, lastMove: squaresOf(uci) }]);
    setViewing(null);
  }, []);

  const reset = useCallback(() => {
    if (!puzzle) return;
    dropReply();
    setPositions(startPositions(puzzle));
    setViewing(null);
    setAt(0);
    setWrongMove(null);
    setShowingSolution(false);
    setHintShown(false);
    setHinted(false);
    setStatus(puzzle.setup ? 'setting' : 'playing');
  }, [puzzle, dropReply]);

  // A new puzzle: from its start, in the same render.
  const [shownId, setShownId] = useState<string | null>(null);
  if (puzzle && puzzle.id !== shownId) {
    setShownId(puzzle.id);
    setPositions(startPositions(puzzle));
    setViewing(null);
    setAt(0);
    setWrongMove(null);
    setShowingSolution(false);
    setHintShown(false);
    setHinted(false);
    setStatus(puzzle.setup ? 'setting' : 'playing');
  }

  const latest = positions[positions.length - 1];

  // The setting move, a moment after the puzzle's shown.
  useEffect(() => {
    if (!puzzle?.setup || status !== 'setting') return;
    const timer = setTimeout(() => {
      push(startOf(puzzle), puzzle.setup as string);
      setStatus('playing');
    }, PUZZLE_SETUP_MS);
    return () => clearTimeout(timer);
  }, [puzzle, status, push]);

  const isLive = viewing === null;

  const tryMove = useCallback(
    (from: Square, to: Square) => {
      if (!puzzle || status !== 'playing' || showingSolution || !isLive) {
        return;
      }
      const fen = latest.fen;
      const uci = uciOf(fen, from, to);
      if (!uci) return;
      const played = play(fen, uci);
      if (!played) return;
      if (!isRight(puzzle, fen, at, uci)) {
        setWrongMove(played.san);
        setHintShown(false);
        setStatus('failed');
        report(false);
        return;
      }
      push(played.fen, uci);
      setHintShown(false);
      const next = at + 1;
      const reply = puzzle.solution[next];
      if (!reply || played.mate) {
        setStatus('solved');
        report(true);
        return;
      }
      setAt(next);
      // The reply, a moment later; then the solver again.
      replyTimer.current = setTimeout(() => {
        replyTimer.current = null;
        const answered = play(played.fen, reply);
        if (!answered) return;
        push(answered.fen, reply);
        setAt(next + 1);
        if (!puzzle.solution[next + 1]) {
          setStatus('solved');
          report(true);
        }
      }, PUZZLE_REPLY_MS);
    },
    [puzzle, status, showingSolution, isLive, latest, at, report, push],
  );

  // The solution, played out from where the solver is.
  useEffect(() => {
    if (!puzzle || !showingSolution) return;
    const move = puzzle.solution[at];
    if (!move) return;
    const timer = setTimeout(() => {
      const next = play(latest.fen, move);
      if (!next) return;
      push(next.fen, move);
      setAt(at + 1);
    }, PUZZLE_SOLUTION_STEP_MS);
    return () => clearTimeout(timer);
  }, [puzzle, showingSolution, latest, at, push]);

  // The solver's next move to find - none while the reply's on its way.
  const nextMove =
    puzzle && status === 'playing' && at % 2 === 0
      ? (puzzle.solution[at] ?? null)
      : null;
  const canHint = nextMove !== null && !showingSolution;

  const showHint = useCallback(() => {
    if (!canHint) return;
    setViewing(null);
    setHintShown(true);
    setHinted(true);
    report(false);
  }, [canHint, report]);

  const showSolution = useCallback(() => {
    if (!puzzle || status === 'setting') return;
    dropReply();
    if (status === 'playing') report(false);
    if (status !== 'solved') setStatus('failed');
    setHintShown(false);
    setViewing(null);
    setShowingSolution(true);
  }, [puzzle, status, report, dropReply]);

  const shownIndex = viewing ?? positions.length - 1;
  const shown = positions[shownIndex];
  const steps: PuzzleSteps = {
    back: () => shownIndex > 0 && setViewing(shownIndex - 1),
    forward: () => {
      if (shownIndex >= positions.length - 1) return;
      setViewing(
        shownIndex + 1 === positions.length - 1 ? null : shownIndex + 1,
      );
    },
    canGoBack: shownIndex > 0,
    canGoForward: shownIndex < positions.length - 1,
  };

  return {
    status,
    fen: shown.fen,
    lastMove: shown.lastMove,
    isLive,
    solver: puzzle ? solverColor(puzzle) : 'w',
    wrongMove,
    showingSolution,
    hint: hintShown && isLive && nextMove ? squaresOf(nextMove) : null,
    hinted,
    canHint,
    tryMove,
    showHint,
    showSolution,
    retry: reset,
    steps,
  };
}
