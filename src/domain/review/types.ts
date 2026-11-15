import { Color } from 'chess.js';

import type { EngineScore } from '../evalScore';
import type { Opening } from '../openings';

// How good a move was, best first - the order the review lists them in.
export const MOVE_CLASSES = [
  'brilliant',
  'great',
  'best',
  'excellent',
  'good',
  'book',
  'inaccuracy',
  'mistake',
  'miss',
  'blunder',
] as const;

export type MoveClass = (typeof MOVE_CLASSES)[number];

// What the engine made of one position: all a review keeps of a search, and
// what the server stores, so the classes and words can be worked out afresh.
export type PositionEval = {
  // From white's point of view, as best play would have it.
  score: EngineScore;
  // The best move and the line it starts, in UCI - none once the game's over.
  pv: string[];
  // The next best move's score, for whether the best was the only good one.
  second: EngineScore | null;
  depth: number;
};

// A thing a move did, or let the opponent do - what the review says about it
// is chosen from these (see phrases.ts).
export type MoveFact =
  | { kind: 'book'; opening: string | null }
  | { kind: 'mates' }
  | { kind: 'forcesMate'; moves: number }
  | { kind: 'allowsMate'; moves: number }
  | { kind: 'missesMate'; moves: number }
  | { kind: 'hangs'; piece: PieceName }
  | { kind: 'allowsFork'; piece: PieceName }
  | { kind: 'allowsPin'; piece: PieceName }
  | { kind: 'trapped'; piece: PieceName }
  | { kind: 'losesMaterial'; piece: PieceName }
  | { kind: 'missesWin'; piece: PieceName }
  | { kind: 'sacrifice'; piece: PieceName }
  | { kind: 'fork'; piece: PieceName }
  | { kind: 'pin'; piece: PieceName }
  | { kind: 'winsMaterial'; piece: PieceName }
  | { kind: 'takesFree'; piece: PieceName }
  | { kind: 'saves'; piece: PieceName }
  | { kind: 'castles'; side: 'king' | 'queen' }
  | { kind: 'develops'; piece: PieceName }
  | { kind: 'centre' }
  | { kind: 'passedPawn' }
  | { kind: 'trades' }
  | { kind: 'check' }
  | { kind: 'slips' };

export type PieceName = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen';

// What the review says about a move: a bubble's body, with words for an idea
// worth knowing - "fork", "center" - marked *like this*, and how it's read
// aloud.
export type ReviewComment = { text: string; spoken: string };

export type ReviewedMove = {
  // 1 for white's first move, as the game's moves count.
  ply: number;
  color: Color;
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  // Best play's score before the move, and the score the move left.
  scoreBefore: EngineScore;
  scoreAfter: EngineScore;
  // The best move here, and its line, in UCI - and the line that answered
  // the move played.
  bestLine: string[];
  bestSan: string | null;
  replyLine: string[];
  // How much of the mover's winning chances the move gave away, 0 to 100.
  winLoss: number;
  accuracy: number;
  moveClass: MoveClass;
  facts: MoveFact[];
  comment: ReviewComment;
};

export type ClassCounts = Record<MoveClass, number>;

// A side's accuracy, the rating it played at (see gameRating), and how
// many of its moves fell in each class.
export type SideReview = {
  accuracy: number;
  rating: number;
  counts: ClassCounts;
};

// The themes a review closes on.
export type ReviewTheme = 'opening' | 'tactics' | 'strategy' | 'endgame';

export type ThemeCard = {
  theme: ReviewTheme;
  title: string;
  text: string;
  // The move it's about, shown on the board with it - an index into the
  // review's moves - or null for none in particular.
  moveIndex: number | null;
};

export type GameReview = {
  startFen: string;
  // The score of every position, the start first - the graph's points.
  scores: EngineScore[];
  moves: ReviewedMove[];
  white: SideReview;
  black: SideReview;
  opening: Opening | null;
  // The engine's depth - the shallowest of the positions'.
  depth: number;
};
