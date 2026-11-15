import { useCallback, useEffect, useMemo, useState } from 'react';
import { Chess, Color, Square } from 'chess.js';

import { REVIEW_PLAY_STEP_MS } from '../constants/review';
import { bestMoveOf, BestMoveView } from '../domain/review/buildReview';
import { keyMoments, nextKeyMoment } from '../domain/review/keyMoments';
import type { GameReview, ReviewedMove } from '../domain/review/types';

// Where a review is: its summary, stepping through the moves, or its close.
export type ReviewPhase = 'summary' | 'stepping' | 'done';

// What the board shows at a move: the move played, the best move in its
// place, or the position before it to find a better move in.
export type ReviewMode =
  | { kind: 'move' }
  | { kind: 'best'; best: BestMoveView }
  | { kind: 'retry'; tried: RetryAttempt | null };

export type RetryAttempt = {
  uci: string;
  san: string;
  fenAfter: string;
  verdict: 'checking' | 'right' | 'wrong';
};

// Whether a move tried in place of another is good enough - the engine's
// own choice, or one that gives away next to nothing.
export type RetryJudge = (
  move: ReviewedMove,
  uci: string,
  fenAfter: string,
) => Promise<boolean>;

// Where Next plays the moves to: a key moment to stop at, or the last move,
// and then the review's close.
type PlayTarget = { index: number; then: 'stop' | 'done' };

export type ReviewStepper = {
  phase: ReviewPhase;
  // The move shown: -1 for the start, before any.
  index: number;
  move: ReviewedMove | null;
  moments: number[];
  // The moves being played on to the next key moment.
  isPlaying: boolean;
  // Stepped away from the moment the review was at - Next returns there.
  isOffPath: boolean;
  mode: ReviewMode;
  // The engine's line shown, from the move played.
  showLine: boolean;
  start: () => void;
  next: () => void;
  back: () => void;
  forward: () => void;
  goTo: (index: number) => void;
  toggleLine: () => void;
  toggleBest: () => void;
  retry: () => void;
  tryMove: (from: Square, to: Square) => void;
  backToSummary: () => void;
};

// Stepping through a review the way a coach would: Next plays the game on,
// a move at a time, and stops at each key moment of the side reviewed -
// tapped again while it plays, it goes straight there; ‹ › go a move at a
// time, and from any move the best one can be shown, or tried for.
export function useReviewStepper(
  review: GameReview | null,
  side: Color,
  judge: RetryJudge,
): ReviewStepper {
  const [phase, setPhase] = useState<ReviewPhase>('summary');
  const [index, setIndex] = useState(-1);
  const [coachIndex, setCoachIndex] = useState(-1);
  const [mode, setMode] = useState<ReviewMode>({ kind: 'move' });
  const [showLine, setShowLine] = useState(false);
  // Where the moves are being played to, one at a time - the next key
  // moment, or the end, to close.
  const [playing, setPlaying] = useState<PlayTarget | null>(null);
  const moves = useMemo(() => review?.moves ?? [], [review]);
  const moments = useMemo(() => keyMoments(moves, side), [moves, side]);
  const last = moves.length - 1;

  const show = useCallback((at: number) => {
    setIndex(at);
    setMode({ kind: 'move' });
  }, []);

  // Arrived where the moves were played to: stop there.
  const arrive = useCallback(
    (target: PlayTarget) => {
      setPlaying(null);
      setCoachIndex(target.index);
      show(target.index);
      if (target.then === 'done') setPhase('done');
    },
    [show],
  );

  // The next stop after a move: its next key moment, or the end.
  const playOnFrom = useCallback(
    (from: number) => {
      const upcoming = nextKeyMoment(moments, from);
      const target: PlayTarget =
        upcoming === null
          ? { index: last, then: 'done' }
          : { index: upcoming, then: 'stop' };
      if (target.index <= from) arrive(target);
      else setPlaying(target);
    },
    [moments, last, arrive],
  );

  // A move at a time, until the stop's reached.
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      const at = index + 1;
      if (at >= playing.index) arrive(playing);
      else show(at);
    }, REVIEW_PLAY_STEP_MS);
    return () => clearTimeout(timer);
  }, [playing, index, arrive, show]);

  // From the start, every move played up to the first key moment.
  const start = useCallback(() => {
    setPhase('stepping');
    setCoachIndex(-1);
    show(-1);
    playOnFrom(-1);
  }, [show, playOnFrom]);

  const next = useCallback(() => {
    // Played on to, already: straight there.
    if (playing) {
      arrive(playing);
      return;
    }
    if (index !== coachIndex) {
      show(coachIndex);
      return;
    }
    playOnFrom(index);
  }, [playing, index, coachIndex, show, arrive, playOnFrom]);

  const goTo = useCallback(
    (at: number) => {
      if (phase === 'summary') setPhase('stepping');
      setPlaying(null);
      show(Math.max(-1, Math.min(last, at)));
    },
    [phase, last, show],
  );
  const back = useCallback(() => goTo(index - 1), [goTo, index]);
  const forward = useCallback(() => goTo(index + 1), [goTo, index]);

  const move = index >= 0 ? (moves[index] ?? null) : null;

  const toggleBest = useCallback(() => {
    if (!move) return;
    if (mode.kind === 'best') {
      setMode({ kind: 'move' });
      return;
    }
    const best = bestMoveOf(move, review?.startFen);
    if (best) setMode({ kind: 'best', best });
  }, [move, mode, review]);

  const retry = useCallback(() => {
    if (move) setMode({ kind: 'retry', tried: null });
  }, [move]);

  const tryMove = useCallback(
    (from: Square, to: Square) => {
      if (!move || mode.kind !== 'retry') return;
      let played;
      try {
        // A pawn tried to its last rank is made a queen.
        played = new Chess(move.fenBefore).move({ from, to, promotion: 'q' });
      } catch {
        return;
      }
      const tried: RetryAttempt = {
        uci: played.lan,
        san: played.san,
        fenAfter: played.after,
        verdict: 'checking',
      };
      if (played.lan === move.uci) tried.verdict = 'wrong';
      else if (played.lan === move.bestLine[0]) tried.verdict = 'right';
      setMode({ kind: 'retry', tried });
      if (tried.verdict !== 'checking') return;
      judge(move, played.lan, played.after).then(
        (good) =>
          setMode((current) =>
            current.kind === 'retry' && current.tried?.uci === tried.uci
              ? {
                  kind: 'retry',
                  tried: { ...tried, verdict: good ? 'right' : 'wrong' },
                }
              : current,
          ),
        () => {},
      );
    },
    [move, mode, judge],
  );

  const toggleLine = useCallback(() => setShowLine((shown) => !shown), []);
  const backToSummary = useCallback(() => {
    setPhase('summary');
    setPlaying(null);
    show(-1);
  }, [show]);

  return {
    phase,
    index,
    move,
    moments,
    isPlaying: playing !== null,
    isOffPath: phase === 'stepping' && !playing && index !== coachIndex,
    mode,
    showLine,
    start,
    next,
    back,
    forward,
    goTo,
    toggleLine,
    toggleBest,
    retry,
    tryMove,
    backToSummary,
  };
}
