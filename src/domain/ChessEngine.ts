import { Chess, Color, Move, PieceSymbol, Square } from "chess.js";

import { AppliedMove, DomainMove, DomainPiece, MoveResult } from "./types";
import {
  BLACK_KING_SIDE_ROOK_CASTLED_SQUARE,
  BLACK_KING_SIDE_ROOK_INITIAL_SQUARE,
  BLACK_QUEEN_SIDE_ROOK_CASTLED_SQUARE,
  BLACK_QUEEN_SIDE_ROOK_INITIAL_SQUARE,
  WHITE_KING_SIDE_ROOK_CASTLED_SQUARE,
  WHITE_KING_SIDE_ROOK_INITIAL_SQUARE,
  WHITE_QUEEN_SIDE_ROOK_CASTLED_SQUARE,
  WHITE_QUEEN_SIDE_ROOK_INITIAL_SQUARE,
} from "./castlingSquares";

function toDomainMove(move: Move): DomainMove {
  return {
    from: move.from,
    to: move.to,
    piece: move.piece,
    color: move.color,
    captured: move.captured,
    promotionPiece: move.promotion,
    san: move.san,
  };
}

// The en passant captured pawn always sits on the capturing pawn's own rank,
// at the destination's file - true regardless of which color is capturing.
function getEnPassantCapturedSquare(from: Square, to: Square): Square {
  return (to.charAt(0) + from.charAt(1)) as Square;
}

function getCastlingRookSquares(move: Move): { rookFrom: Square; rookTo: Square } | null {
  if (move.isKingsideCastle()) {
    return move.color === "w"
      ? { rookFrom: WHITE_KING_SIDE_ROOK_INITIAL_SQUARE, rookTo: WHITE_KING_SIDE_ROOK_CASTLED_SQUARE }
      : { rookFrom: BLACK_KING_SIDE_ROOK_INITIAL_SQUARE, rookTo: BLACK_KING_SIDE_ROOK_CASTLED_SQUARE };
  }
  if (move.isQueensideCastle()) {
    return move.color === "w"
      ? { rookFrom: WHITE_QUEEN_SIDE_ROOK_INITIAL_SQUARE, rookTo: WHITE_QUEEN_SIDE_ROOK_CASTLED_SQUARE }
      : { rookFrom: BLACK_QUEEN_SIDE_ROOK_INITIAL_SQUARE, rookTo: BLACK_QUEEN_SIDE_ROOK_CASTLED_SQUARE };
  }
  return null;
}

function toAppliedMove(move: Move): AppliedMove {
  const isEnPassant = move.isEnPassant();
  // chess.js's own isCapture() excludes en passant (it checks a distinct
  // flag) even though `captured` is set in both cases - `captured` is the
  // reliable "something was taken" signal for either kind of capture.
  const isCapture = Boolean(move.captured);
  const castlingRookSquares = getCastlingRookSquares(move);

  return {
    from: move.from,
    to: move.to,
    piece: move.piece,
    color: move.color,
    isCapture,
    capturedSquare: isCapture
      ? (isEnPassant ? getEnPassantCapturedSquare(move.from, move.to) : move.to)
      : undefined,
    isEnPassant,
    isKingSideCastle: move.isKingsideCastle(),
    isQueenSideCastle: move.isQueensideCastle(),
    rookFrom: castlingRookSquares?.rookFrom,
    rookTo: castlingRookSquares?.rookTo,
    isPromotion: move.isPromotion(),
    promotionPiece: move.promotion,
  };
}

// Framework-agnostic facade over chess.js - the single place business rules
// about moving pieces live. No React/React Native imports, so it's plain
// Jest-testable with no rendering.
export class ChessEngine {
  private game: Chess;

  constructor(fen?: string) {
    this.game = fen ? new Chess(fen) : new Chess();
  }

  getBoardSnapshot(): DomainPiece[] {
    const pieces: DomainPiece[] = [];
    this.game.board().forEach((row) => {
      row.forEach((piece) => {
        if (piece) {
          pieces.push({ square: piece.square, type: piece.type, color: piece.color });
        }
      });
    });
    return pieces;
  }

  getLegalMoves(square: Square): DomainMove[] {
    return this.game.moves({ square, verbose: true }).map(toDomainMove);
  }

  getLegalMoveSquares(square: Square): Square[] {
    return this.getLegalMoves(square).map((move) => move.to);
  }

  attemptMove(from: Square, to: Square, promotionPiece?: PieceSymbol): MoveResult {
    const legalMoves = this.game.moves({ square: from, verbose: true });
    const legalMove = legalMoves.find((move) => move.to === to);

    if (!legalMove) {
      return { status: "illegal" };
    }

    if (legalMove.isPromotion() && !promotionPiece) {
      return { status: "needs-promotion-choice", from, to };
    }

    // chess.js's own move object shape calls this field `promotion` - that
    // key name is its external API, not ours, so it stays as-is here even
    // though our own promotionPiece is named differently.
    const appliedMove = promotionPiece
      ? this.game.move({ ...legalMove, promotion: promotionPiece })
      : this.game.move(legalMove);

    return { status: "ok", move: toAppliedMove(appliedMove) };
  }

  getTurn(): Color {
    return this.game.turn();
  }

  isGameOver(): boolean {
    return this.game.isGameOver();
  }

  isCheck(): boolean {
    return this.game.isCheck();
  }

  isCheckmate(): boolean {
    return this.game.isCheckmate();
  }

  isStalemate(): boolean {
    return this.game.isStalemate();
  }

  isDraw(): boolean {
    return this.game.isDraw();
  }

  getFen(): string {
    return this.game.fen();
  }
}
