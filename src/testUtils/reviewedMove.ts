import { Color } from 'chess.js';

import type { EngineScore } from '../domain/evalScore';
import type {
  GameReview,
  MoveClass,
  MoveFact,
  ReviewedMove,
} from '../domain/review/types';

// Positions for made-up reviews: a quiet middlegame, and an endgame.
export const MIDGAME =
  'r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4';
export const ENDGAME = '4k3/8/8/8/8/8/8/R3K3 w - - 0 40';

export const cp = (value: number): EngineScore => ({ kind: 'cp', cp: value });

// A move of a made-up review - white's on even indexes - its scores (from
// white's side) in centipawns, and whatever else a test needs of it.
export function makeReviewedMove(
  index: number,
  {
    moveClass = 'good',
    winLoss = 0,
    before = 0,
    after = before,
    second = null,
    fen = MIDGAME,
    fenAfter = fen,
    san = `M${index + 1}`,
    accuracy = 90,
    best = false,
    facts = [],
    isRecapture = false,
    uci = 'e2e4',
    bestLine,
    replyLine = [],
  }: {
    moveClass?: MoveClass;
    winLoss?: number;
    before?: number;
    after?: number;
    // The next best move's score, from white's side.
    second?: number | null;
    fen?: string;
    // The position after it - the one before, unless given.
    fenAfter?: string;
    san?: string;
    accuracy?: number;
    // The move played was the engine's own.
    best?: boolean;
    facts?: MoveFact[];
    isRecapture?: boolean;
    uci?: string;
    bestLine?: string[];
    replyLine?: string[];
  } = {},
): ReviewedMove {
  const color: Color = index % 2 === 0 ? 'w' : 'b';
  return {
    ply: index + 1,
    color,
    san,
    uci,
    fenBefore: fen,
    fenAfter,
    scoreBefore: cp(before),
    scoreAfter: cp(after),
    secondScore: second === null ? null : cp(second),
    isRecapture,
    bestLine: bestLine ?? (best ? [uci] : []),
    bestSan: null,
    replyLine,
    winLoss,
    accuracy,
    moveClass,
    facts,
    comment: { text: '', spoken: '' },
  };
}

// A made-up review of those moves.
export function makeReview(
  moves: ReviewedMove[],
  overrides: Partial<GameReview> = {},
): GameReview {
  return {
    startFen: MIDGAME,
    scores: [],
    moves,
    white: { accuracy: 90, rating: 1500, counts: {} } as GameReview['white'],
    black: { accuracy: 90, rating: 1500, counts: {} } as GameReview['black'],
    opening: { eco: 'C47', name: 'Four Knights Game' } as GameReview['opening'],
    depth: 14,
    ...overrides,
  };
}
