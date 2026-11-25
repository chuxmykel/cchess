import { useCallback, useEffect, useMemo, useState } from 'react';
import { Chess, Color, Square } from 'chess.js';

import {
  REVIEW_LINE_SHOWN,
  REVIEW_LINE_STEP_MS,
  REVIEW_PLAY_STEP_MS,
} from '../constants/review';
import { bestMoveOf, BestMoveView } from '../domain/review/buildReview';
import { keyMoments, nextKeyMoment } from '../domain/review/keyMoments';
import { isSlip } from '../domain/review/types';
import {
  hasBetterMove,
  lineWorthShowing,
} from '../domain/review/reviewActions';
import { themeCards } from '../domain/review/themes';
import type {
  GameReview,
  ReviewedMove,
  ThemeCard,
} from '../domain/review/types';

// Where a review is: its summary, stepping through the moves, or its close -
// the cards after the last move.
export type ReviewPhase = 'summary' | 'stepping' | 'done';

// What the board shows at a move: the move played, the best move in its
// place, or the position before it to find a better move in.
export type ReviewMode =
  | { kind: 'move' }
  | { kind: 'best'; best: BestMoveView }
  | { kind: 'retry'; tried: RetryAttempt | null }
  // Asked what you'd play, before the move's revealed (the cchess style).
  | { kind: 'guess'; tried: RetryAttempt | null };

// How a guess went, by its first try: found, missed, or revealed untried.
export type GuessResult = 'found' | 'missed' | 'skipped';

export type ReviewStepperOptions = {
  // Where Next stops, in place of the key moments.
  stops?: number[];
  // The stops where, arriving, it asks for the move first.
  guesses?: number[];
  // Closing cards after the theme cards.
  extraCards?: ThemeCard[];
};

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

// Where Next plays the moves to: the next key moment, or past the last
// move to the first closing card.
type PlayTarget = { index: number };

export type ReviewStepper = {
  phase: ReviewPhase;
  // Where the review is: -1 for the start, before any move, then each move
  // - an index into the review's moves - and after the last, each closing
  // card.
  index: number;
  move: ReviewedMove | null;
  // The closing cards, and the one shown - null while on a move.
  cards: ThemeCard[];
  card: ThemeCard | null;
  moments: number[];
  // The moves being played on to the next key moment.
  isPlaying: boolean;
  mode: ReviewMode;
  // Show: the line from the move on the board - the one answering the move
  // played, or following the best move - played out a move at a time: how
  // many of its moves are on the board, or null while it's hidden.
  lineStep: number | null;
  // The line Show plays, and the position it's played from.
  line: { fen: string; moves: string[] } | null;
  // What's offered here: Show where the line explains the move, Best
  // where there was a better one.
  canShowLine: boolean;
  canShowBest: boolean;
  // How each guess went, by move index.
  guessResults: Record<number, GuessResult>;
  start: () => void;
  next: () => void;
  back: () => void;
  forward: () => void;
  goTo: (index: number) => void;
  toggleLine: () => void;
  toggleBest: () => void;
  retry: () => void;
  tryMove: (from: Square, to: Square) => void;
  // Out of a guess: the move played shown.
  reveal: () => void;
  backToSummary: () => void;
};

// Stepping through a review the way a coach would: Next plays the game on,
// a move at a time, and stops at each key moment of the side reviewed -
// tapped again while it plays, it goes straight there - then on through the
// closing cards. Wherever ‹ › or the move list go is where the review is:
// Next plays on from there, as if it had come that way. From any move the
// best one can be shown, or tried for, and the line from it played out.
//
// Given stops, Next stops there instead - the cchess style's chapters - and
// at a guess stop it first asks what you'd play.
export function useReviewStepper(
  review: GameReview | null,
  side: Color,
  judge: RetryJudge,
  { stops, guesses, extraCards }: ReviewStepperOptions = {},
): ReviewStepper {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(-1);
  const [mode, setMode] = useState<ReviewMode>({ kind: 'move' });
  const [lineStep, setLineStep] = useState<number | null>(null);
  // Where the moves are being played to, one at a time - the next key
  // moment, or the end.
  const [playing, setPlaying] = useState<PlayTarget | null>(null);
  const moves = useMemo(() => review?.moves ?? [], [review]);
  const moments = useMemo(
    () => stops ?? keyMoments(moves, side),
    [stops, moves, side],
  );
  const cards = useMemo(
    () => (review ? [...themeCards(review, side), ...(extraCards ?? [])] : []),
    [review, side, extraCards],
  );
  const [guessResults, setGuessResults] = useState<Record<number, GuessResult>>(
    {},
  );
  // The first verdict on a guess is the one that counts.
  const recordGuess = useCallback((at: number, result: GuessResult) => {
    setGuessResults((results) =>
      at in results ? results : { ...results, [at]: result },
    );
  }, []);
  const last = moves.length - 1;
  const end = last + cards.length;

  const show = useCallback((at: number) => {
    setIndex(at);
    setMode({ kind: 'move' });
    setLineStep(null);
  }, []);

  // Arrived where the moves were played to: stop there - asking for the
  // move first, at a guess stop not yet guessed.
  const arrive = useCallback(
    (target: PlayTarget) => {
      setPlaying(null);
      show(target.index);
      if (guesses?.includes(target.index) && !(target.index in guessResults)) {
        setMode({ kind: 'guess', tried: null });
      }
    },
    [show, guesses, guessResults],
  );

  // The next stop after a move: its next key moment, or else the end -
  // the first closing card, after the last move.
  const playOnFrom = useCallback(
    (from: number) => {
      const upcoming = nextKeyMoment(moments, from);
      const target = { index: upcoming ?? Math.min(last + 1, end) };
      if (target.index <= from) arrive(target);
      else setPlaying(target);
    },
    [moments, last, end, arrive],
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
    setStarted(true);
    show(-1);
    playOnFrom(-1);
  }, [show, playOnFrom]);

  // On from wherever the review is: through the moves to the next key
  // moment, or from one closing card to the next.
  const next = useCallback(() => {
    if (playing) {
      arrive(playing);
      return;
    }
    if (index >= last) {
      show(Math.min(index + 1, end));
      return;
    }
    playOnFrom(index);
  }, [playing, index, last, end, show, arrive, playOnFrom]);

  const goTo = useCallback(
    (at: number) => {
      setStarted(true);
      setPlaying(null);
      show(Math.max(-1, Math.min(end, at)));
    },
    [end, show],
  );
  const back = useCallback(() => goTo(index - 1), [goTo, index]);
  const forward = useCallback(() => goTo(index + 1), [goTo, index]);

  const move = index >= 0 ? (moves[index] ?? null) : null;
  const card = index > last ? (cards[index - last - 1] ?? null) : null;

  const toggleBest = useCallback(() => {
    if (!move) return;
    setLineStep(null);
    if (mode.kind === 'best') {
      setMode({ kind: 'move' });
      return;
    }
    const best = bestMoveOf(move, review?.startFen);
    if (best) setMode({ kind: 'best', best });
  }, [move, mode, review]);

  const retry = useCallback(() => {
    if (!move) return;
    setLineStep(null);
    setMode({ kind: 'retry', tried: null });
  }, [move]);

  const tryMove = useCallback(
    (from: Square, to: Square) => {
      if (!move || (mode.kind !== 'retry' && mode.kind !== 'guess')) return;
      const kind = mode.kind;
      const at = index;
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
      // The move played is wrong to retry - it's the slip - but right to
      // guess, unless it was one.
      if (played.lan === move.uci) {
        tried.verdict =
          kind === 'guess' && !isSlip(move.moveClass) ? 'right' : 'wrong';
      } else if (played.lan === move.bestLine[0]) tried.verdict = 'right';
      setMode({ kind, tried });
      const settle = (verdict: 'right' | 'wrong') => {
        if (kind === 'guess') {
          recordGuess(at, verdict === 'right' ? 'found' : 'missed');
        }
      };
      if (tried.verdict !== 'checking') {
        settle(tried.verdict);
        return;
      }
      judge(move, played.lan, played.after).then(
        (good) => {
          const verdict = good ? 'right' : 'wrong';
          setMode((current) =>
            current.kind === kind && current.tried?.uci === tried.uci
              ? { kind, tried: { ...tried, verdict } }
              : current,
          );
          settle(verdict);
        },
        () => {},
      );
    },
    [move, mode, index, judge, recordGuess],
  );

  const reveal = useCallback(() => {
    if (mode.kind !== 'guess') return;
    recordGuess(index, 'skipped');
    setMode({ kind: 'move' });
  }, [mode, index, recordGuess]);

  const line = useMemo(() => {
    if (!move) return null;
    if (mode.kind === 'best') {
      return { fen: mode.best.fenAfter, moves: move.bestLine.slice(1) };
    }
    if (mode.kind === 'move') {
      return { fen: move.fenAfter, moves: move.replyLine };
    }
    return null;
  }, [move, mode]);
  const lineLength = Math.min(line?.moves.length ?? 0, REVIEW_LINE_SHOWN);

  // Shown, the line's first move at once; hidden, the board back as it was.
  const toggleLine = useCallback(() => {
    setLineStep((step) => (step === null && lineLength > 0 ? 1 : null));
  }, [lineLength]);

  // Then the rest of it, a move at a time.
  useEffect(() => {
    if (lineStep === null || lineStep >= lineLength) return;
    const timer = setTimeout(
      () => setLineStep((step) => (step === null ? null : step + 1)),
      REVIEW_LINE_STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [lineStep, lineLength]);

  const backToSummary = useCallback(() => {
    setStarted(false);
    setPlaying(null);
    show(-1);
  }, [show]);

  return {
    phase: !started ? 'summary' : index > last ? 'done' : 'stepping',
    index,
    move,
    cards,
    card,
    moments,
    isPlaying: playing !== null,
    mode,
    lineStep,
    line,
    canShowLine:
      !!line?.moves.length &&
      (mode.kind === 'best' || (!!move && lineWorthShowing(move))),
    canShowBest: mode.kind === 'best' || (!!move && hasBetterMove(move)),
    guessResults,
    start,
    next,
    back,
    forward,
    goTo,
    toggleLine,
    toggleBest,
    retry,
    tryMove,
    reveal,
    backToSummary,
  };
}
