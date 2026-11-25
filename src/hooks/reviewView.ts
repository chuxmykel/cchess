import { Color, Square } from 'chess.js';

import {
  EngineScore,
  formatScore,
  NumberedMove,
  numberMoves,
  pvToSan,
} from '../domain/evalScore';
import { REVIEW_LINE_SHOWN, ReviewStyle } from '../constants/review';
import { markOf } from '../domain/review/marks';
import { playLine } from '../domain/review/motifs';
import {
  cchessHeadline,
  cchessSpoken,
  GUESS_TITLE,
  guessLine,
  guessPrompt,
  headline,
  type Names,
  RETRY_TITLE,
  retryLine,
} from '../domain/review/phrases';
import { sanToSpeech, textToSpeech } from '../domain/review/spokenText';
import type { GameReview, MoveClass, ThemeCard } from '../domain/review/types';
import { MoveSquares } from '../domain/types';
import type { ReviewMode, ReviewPhase } from './useReviewStepper';

// An arrow the review draws: the best move, where another was played.
export type ReviewArrow = {
  from: Square;
  to: Square;
  kind: 'best';
};

// What the review shows at a step: the board, and what it says.
export type ReviewView = {
  fen: string;
  lastMove: MoveSquares | null;
  moveClass: MoveClass | null;
  arrows: ReviewArrow[];
  // The side to play a move for, retrying; null while there's none to play.
  movableColor: Color | null;
  score: EngineScore;
  bubble: {
    moveClass: MoveClass | null;
    title: string | null;
    score: string | null;
    text: string;
    line: NumberedMove[] | null;
    // The line's move on the board, while it's played out - an index into
    // `line`.
    lineAt: number | null;
  };
  // What's read aloud.
  spoken: string;
};

const SIDE_NAMES = { w: 'White', b: 'Black' } as const;

function squaresOf(uci: string | undefined): MoveSquares | null {
  if (!uci) return null;
  return { from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square };
}

function numberedLine(fen: string, pv: string[]): NumberedMove[] {
  return numberMoves(fen, pvToSan(fen, pv, REVIEW_LINE_SHOWN));
}

// Show's line, played out on the board as far as it's got.
function lineShown(
  line: { fen: string; moves: string[] } | null,
  step: number | null,
): {
  fen: string;
  lastMove: MoveSquares | null;
  numbered: NumberedMove[];
  at: number;
} | null {
  if (!line || step === null || line.moves.length === 0) return null;
  const played = playLine(
    line.fen,
    line.moves,
    Math.min(step, REVIEW_LINE_SHOWN),
  );
  const last = played[played.length - 1];
  return {
    fen: last?.after ?? line.fen,
    lastMove: last ? { from: last.from, to: last.to } : null,
    numbered: numberedLine(line.fen, line.moves),
    at: played.length - 1,
  };
}

export type ReviewViewInput = {
  review: GameReview;
  phase: ReviewPhase;
  index: number;
  mode: ReviewMode;
  // Show's line and how far it's been played, null while hidden.
  line: { fen: string; moves: string[] } | null;
  lineStep: number | null;
  showBestMoves: boolean;
  // The closing theme shown, once the moves are done.
  theme: ThemeCard | null;
  // What the review opens with (see introLine).
  intro: string;
  // How it's told - classic unless said - and, for cchess, the players'
  // names and the time the move shown took ("12s"), if the game had a
  // clock.
  style?: ReviewStyle;
  names?: Names;
  timeSpent?: string | null;
};

export function reviewView({
  review,
  phase,
  index,
  mode,
  line,
  lineStep,
  showBestMoves,
  theme,
  intro,
  style = 'classic',
  names = { w: 'White', b: 'Black' },
  timeSpent = null,
}: ReviewViewInput): ReviewView {
  const move = index >= 0 ? review.moves[index] : null;
  const shown = lineShown(line, lineStep);
  const cchess = style === 'cchess';
  // A class as the board and the bubble mark it: in the cchess style only
  // where there's a mark.
  const marked = (moveClass: MoveClass): MoveClass | null =>
    !cchess || markOf(moveClass) ? moveClass : null;
  const titleOf = (san: string, moveClass: MoveClass) =>
    cchess ? cchessHeadline(san, moveClass) : headline(san, moveClass);

  if (!move) {
    return {
      fen: review.startFen,
      lastMove: null,
      moveClass: null,
      arrows: [],
      movableColor: null,
      score: review.scores[0],
      bubble: {
        moveClass: null,
        title: null,
        score: null,
        text: intro,
        line: null,
        lineAt: null,
      },
      spoken: textToSpeech(intro),
    };
  }

  if (mode.kind === 'best') {
    const { best } = mode;
    const text = best.comment.text;
    return {
      fen: shown?.fen ?? best.fenAfter,
      lastMove: shown ? shown.lastMove : squaresOf(best.uci),
      moveClass: shown ? null : marked('best'),
      arrows: [],
      movableColor: null,
      score: move.scoreBefore,
      bubble: {
        moveClass: marked('best'),
        title: titleOf(best.san, 'best'),
        score: formatScore(move.scoreBefore),
        text,
        line: shown?.numbered ?? null,
        lineAt: shown?.at ?? null,
      },
      spoken: cchess
        ? cchessSpoken(best.san, 'best', text)
        : best.comment.spoken,
    };
  }

  if (mode.kind === 'guess') {
    const { tried } = mode;
    const stillTrying = !tried || tried.verdict === 'wrong';
    const text = tried
      ? guessLine({ ...tried, isPlayed: tried.uci === move.uci })
      : guessPrompt(move.ply, names[move.color]);
    return {
      fen: stillTrying ? move.fenBefore : tried.fenAfter,
      lastMove: stillTrying ? null : squaresOf(tried.uci),
      moveClass: null,
      arrows: [],
      movableColor: stillTrying ? move.color : null,
      score: move.scoreBefore,
      bubble: {
        moveClass: null,
        title: GUESS_TITLE,
        score: null,
        text,
        line: null,
        lineAt: null,
      },
      spoken: tried ? text.replace(tried.san, sanToSpeech(tried.san)) : text,
    };
  }

  if (mode.kind === 'retry') {
    const { tried } = mode;
    const side = SIDE_NAMES[move.color];
    const stillTrying = !tried || tried.verdict === 'wrong';
    const text = retryLine(
      side,
      tried && { ...tried, isPlayed: tried.uci === move.uci },
    );
    const spoken = tried
      ? text.replace(tried.san, sanToSpeech(tried.san))
      : text;
    return {
      fen: stillTrying ? move.fenBefore : tried.fenAfter,
      lastMove: stillTrying ? null : squaresOf(tried.uci),
      moveClass: tried?.verdict === 'right' ? 'best' : null,
      arrows: [],
      movableColor: stillTrying ? move.color : null,
      score: move.scoreBefore,
      bubble: {
        moveClass: tried?.verdict === 'right' ? 'best' : null,
        title: RETRY_TITLE,
        score: null,
        text,
        line: null,
        lineAt: null,
      },
      spoken,
    };
  }

  const arrows: ReviewArrow[] = [];
  const bestSquares = squaresOf(move.bestLine[0]);
  const isBest = move.bestLine[0] === move.uci;
  if (showBestMoves && bestSquares && !isBest && !shown) {
    arrows.push({ ...bestSquares, kind: 'best' });
  }

  const closing = phase === 'done' && theme;
  return {
    fen: shown?.fen ?? move.fenAfter,
    lastMove: shown ? shown.lastMove : squaresOf(move.uci),
    moveClass: shown ? null : marked(move.moveClass),
    arrows,
    movableColor: null,
    score: move.scoreAfter,
    bubble: closing
      ? {
          moveClass: null,
          title: theme.title,
          score: null,
          text: theme.text,
          line: null,
          lineAt: null,
        }
      : {
          moveClass: marked(move.moveClass),
          title: titleOf(move.san, move.moveClass),
          score: timeSpent
            ? `${formatScore(move.scoreAfter)} · ${timeSpent}`
            : formatScore(move.scoreAfter),
          text: move.comment.text,
          line: shown?.numbered ?? null,
          lineAt: shown?.at ?? null,
        },
    spoken: closing
      ? `${theme.title}. ${textToSpeech(theme.text)}`
      : cchess
        ? cchessSpoken(move.san, move.moveClass, move.comment.text)
        : move.comment.spoken,
  };
}
