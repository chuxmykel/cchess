import { Color, Square } from 'chess.js';

import {
  EngineScore,
  formatScore,
  NumberedMove,
  numberMoves,
  pvToSan,
} from '../domain/evalScore';
import { headline, RETRY_TITLE, retryLine } from '../domain/review/phrases';
import { sanToSpeech, textToSpeech } from '../domain/review/spokenText';
import type { GameReview, MoveClass, ThemeCard } from '../domain/review/types';
import { MoveSquares } from '../domain/types';
import type { ReviewMode, ReviewPhase } from './useReviewStepper';

// An arrow the review draws: the best move, or what answers the move played.
export type ReviewArrow = {
  from: Square;
  to: Square;
  kind: 'best' | 'reply';
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
  };
  // What's read aloud.
  spoken: string;
};

const LINE_SHOWN = 8;
const SIDE_NAMES = { w: 'White', b: 'Black' } as const;

function squaresOf(uci: string | undefined): MoveSquares | null {
  if (!uci) return null;
  return { from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square };
}

function numberedLine(fen: string, pv: string[]): NumberedMove[] {
  return numberMoves(fen, pvToSan(fen, pv, LINE_SHOWN));
}

export type ReviewViewInput = {
  review: GameReview;
  phase: ReviewPhase;
  index: number;
  mode: ReviewMode;
  showLine: boolean;
  showBestMoves: boolean;
  // The closing theme shown, once the moves are done.
  theme: ThemeCard | null;
  // What the review opens with (see introLine).
  intro: string;
};

export function reviewView({
  review,
  phase,
  index,
  mode,
  showLine,
  showBestMoves,
  theme,
  intro,
}: ReviewViewInput): ReviewView {
  const move = index >= 0 ? review.moves[index] : null;

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
      },
      spoken: textToSpeech(intro),
    };
  }

  if (mode.kind === 'best') {
    const { best } = mode;
    const text = best.comment.text;
    return {
      fen: best.fenAfter,
      lastMove: squaresOf(best.uci),
      moveClass: 'best',
      arrows: [],
      movableColor: null,
      score: move.scoreBefore,
      bubble: {
        moveClass: 'best',
        title: headline(best.san, 'best'),
        score: formatScore(move.scoreBefore),
        text,
        line: showLine ? numberedLine(move.fenBefore, move.bestLine) : null,
      },
      spoken: best.comment.spoken,
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
      },
      spoken,
    };
  }

  const arrows: ReviewArrow[] = [];
  const bestSquares = squaresOf(move.bestLine[0]);
  const isBest = move.bestLine[0] === move.uci;
  if (showBestMoves && bestSquares && !isBest) {
    arrows.push({ ...bestSquares, kind: 'best' });
  }
  const replySquares = squaresOf(move.replyLine[0]);
  if (showLine && replySquares) arrows.push({ ...replySquares, kind: 'reply' });

  const closing = phase === 'done' && theme;
  return {
    fen: move.fenAfter,
    lastMove: squaresOf(move.uci),
    moveClass: move.moveClass,
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
        }
      : {
          moveClass: move.moveClass,
          title: headline(move.san, move.moveClass),
          score: formatScore(move.scoreAfter),
          text: move.comment.text,
          line: showLine ? numberedLine(move.fenAfter, move.replyLine) : null,
        },
    spoken: closing
      ? `${theme.title}. ${textToSpeech(theme.text)}`
      : move.comment.spoken,
  };
}
