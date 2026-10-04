import { Color, PieceSymbol, Square } from "chess.js";

export type Position = {
  x: number;
  y: number;
};

// The RN-free half of a piece: no animation/view state, just what's on the board.
export type DomainPiece = {
  square: Square;
  type: PieceSymbol;
  color: Color;
};

// The basic identity of a move, shared by both a legal move as reported by
// the engine (DomainMove) and one that's actually been applied
// (AppliedMove): which piece, from where, to where, and - if relevant -
// what it promotes to. Not exported - nothing outside this file needs "just
// the core," only one of the two full shapes below.
type MoveCore = {
  from: Square;
  to: Square;
  piece: PieceSymbol;
  color: Color;
  promotionPiece?: PieceSymbol;
};

// A legal move as reported by the engine, before it's been applied.
export type DomainMove = MoveCore & {
  captured?: PieceSymbol;
  san: string;
};

// A move that has actually been applied to the board, with everything the UI
// needs to animate/update without re-deriving it (capture square, castling
// rook squares, etc).
export type AppliedMove = MoveCore & {
  isCapture: boolean;
  capturedSquare?: Square;
  isEnPassant: boolean;
  isKingSideCastle: boolean;
  isQueenSideCastle: boolean;
  rookFrom?: Square;
  rookTo?: Square;
  isPromotion: boolean;
};

export type MoveResult =
  | { status: "illegal" }
  | { status: "needs-promotion-choice"; from: Square; to: Square }
  | { status: "ok"; move: AppliedMove };

export const PROMOTION_PIECE_TYPES: readonly PieceSymbol[] = ["q", "r", "b", "n"];
