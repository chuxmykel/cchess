import { Chess, Color, Move, Square } from 'chess.js';

import { EngineScore, pvToSan } from '../evalScore';
import { bookOpeningAt, openingAt } from '../openings';
import { gameAccuracy, moveAccuracy } from './accuracy';
import { classifyMove } from './classifyMove';
import { gameRating } from './gameRating';
import { isSacrifice, materialGivenUp, moveFacts, pieceName } from './motifs';
import { commentFor, seedOf } from './phrases';
import {
  ClassCounts,
  GameReview,
  MOVE_CLASSES,
  MoveFact,
  PositionEval,
  ReviewComment,
  ReviewedMove,
  SideReview,
} from './types';
import { winPercent } from './winChances';

export type ReviewMoveInput = { uci: string };

// A game's review from the engine's word on each of its positions - the
// start first, then the position after each move: every move's class, what
// to say about it, and each side's accuracy. The same evals always make the
// same review, so it's the evals that are kept.
export function buildReview(
  startFen: string,
  moves: ReviewMoveInput[],
  evals: PositionEval[],
  seed = '',
  // Each side's rating going into the game, for its game rating.
  ratings: Partial<Record<Color, number | null>> = {},
): GameReview {
  if (evals.length !== moves.length + 1) {
    throw new Error('A review needs an eval for every position');
  }
  const chess = new Chess(startFen);
  const played: Move[] = [];
  for (const { uci } of moves) {
    played.push(
      chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci[4],
      }),
    );
  }
  const fens = [startFen, ...played.map((move) => move.after)];
  const plyOffset = startPly(startFen);

  const reviewed: ReviewedMove[] = [];
  let stillInBook = true;
  played.forEach((move, i) => {
    const color = move.color;
    const before = evals[i];
    const after = evals[i + 1];
    const winBefore = winPercent(before.score, color);
    const winAfter = winPercent(after.score, color);
    const book = stillInBook ? bookOpeningAt(move.after) : null;
    stillInBook = book !== null;
    const previous = reviewed[i - 1];
    const moveClass = classifyMove({
      isBest: before.pv[0] === move.lan,
      isBook: book !== null,
      winBefore,
      winAfter,
      winSecond: before.second ? winPercent(before.second, color) : null,
      rating: ratings[color] ?? null,
      opponentLoss: previous ? previous.winLoss : null,
      isSacrifice: isSacrifice(move),
      isRecapture:
        !!move.captured &&
        !!played[i - 1]?.captured &&
        played[i - 1].to === move.to,
      materialLoss: materialGivenUp(move, before.pv, after.pv),
      scoreLoss: centipawnLoss(before.score, after.score, color),
    });
    const ply = plyOffset + i;
    const facts = moveFacts({
      fenBefore: move.before,
      fenAfter: move.after,
      move,
      moveClass,
      scoreBefore: before.score,
      scoreAfter: after.score,
      bestLine: before.pv,
      replyLine: after.pv,
      ply,
      opening: book?.name ?? null,
    });
    const bestSan = before.pv[0]
      ? (pvToSan(move.before, before.pv, 1)[0] ?? null)
      : null;
    reviewed.push({
      ply,
      color,
      san: move.san,
      uci: move.lan,
      fenBefore: move.before,
      fenAfter: move.after,
      scoreBefore: before.score,
      scoreAfter: after.score,
      bestLine: before.pv,
      bestSan,
      replyLine: after.pv,
      winLoss: Math.max(0, winBefore - winAfter),
      accuracy: moveAccuracy(winBefore, winAfter),
      moveClass,
      facts,
      comment: commentFor(
        {
          san: move.san,
          moveClass,
          bestPiece: bestPieceOf(move.before, before.pv[0]),
        },
        facts,
        seedOf(`${seed}:${ply}`),
      ),
    });
  });

  const scores = evals.map((e) => e.score);
  const firstToMove = startFen.split(' ')[1] as Color;
  const accuracy = gameAccuracy(scores, firstToMove);
  const side = (color: Color): SideReview => ({
    accuracy: accuracy[color] ?? 100,
    rating: gameRating(accuracy[color] ?? 100, ratings[color] ?? null),
    counts: countClasses(reviewed.filter((m) => m.color === color)),
  });
  return {
    startFen,
    scores,
    moves: reviewed,
    white: side('w'),
    black: side('b'),
    opening: openingAt(fens),
    depth: Math.min(
      ...evals.filter((e) => e.pv.length > 0).map((e) => e.depth),
      99,
    ),
  };
}

// The piece that makes a move, by name - a hint at the better move.
function bestPieceOf(fen: string, uci: string | undefined): string | null {
  if (!uci) return null;
  const piece = new Chess(fen).get(uci.slice(0, 2) as Square);
  if (!piece) return null;
  return piece.type === 'k' ? 'king' : pieceName(piece.type);
}

// How much of the score a move gave away, in centipawns from the mover's
// side - each score held to ±10 pawns, past which it's all the same; null
// with a mate on either side.
function centipawnLoss(
  before: EngineScore,
  after: EngineScore,
  color: Color,
): number | null {
  if (before.kind !== 'cp' || after.kind !== 'cp') return null;
  const sign = color === 'w' ? 1 : -1;
  const held = (cp: number) => Math.max(-1000, Math.min(1000, cp * sign));
  return Math.max(0, held(before.cp) - held(after.cp));
}

// The ply a game's first move is, counted as its FEN counts: 1 for white's
// first move from the start.
function startPly(fen: string): number {
  const [, turn, , , , fullmove] = fen.split(' ');
  return (Number(fullmove) || 1) * 2 - (turn === 'w' ? 1 : 0);
}

function countClasses(moves: ReviewedMove[]): ClassCounts {
  const counts = Object.fromEntries(
    MOVE_CLASSES.map((c) => [c, 0]),
  ) as ClassCounts;
  for (const move of moves) counts[move.moveClass] += 1;
  return counts;
}

// A side's winning chances at every position, the start first - the
// review graph's line.
export function winChancesAlong(scores: EngineScore[], color: Color): number[] {
  return scores.map((score) => winPercent(score, color));
}

// The move that was best where another was played - for the review's Best:
// played on the board, with what it would have done.
export type BestMoveView = {
  san: string;
  uci: string;
  fenAfter: string;
  facts: MoveFact[];
  comment: ReviewComment;
};

export function bestMoveOf(move: ReviewedMove, seed = ''): BestMoveView | null {
  const [uci, ...reply] = move.bestLine;
  if (!uci) return null;
  let played: Move;
  try {
    played = new Chess(move.fenBefore).move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci[4],
    });
  } catch {
    return null;
  }
  const facts = moveFacts({
    fenBefore: move.fenBefore,
    fenAfter: played.after,
    move: played,
    moveClass: 'best',
    scoreBefore: move.scoreBefore,
    scoreAfter: move.scoreBefore,
    bestLine: move.bestLine,
    replyLine: reply,
    ply: move.ply,
    opening: null,
  });
  return {
    san: played.san,
    uci,
    fenAfter: played.after,
    facts,
    comment: commentFor(
      { san: played.san, moveClass: 'best', bestPiece: null },
      facts,
      seedOf(`${seed}:best:${move.ply}`),
    ),
  };
}
