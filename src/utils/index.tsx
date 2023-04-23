import { Animated, PanResponderGestureState } from "react-native";
import { Square, Move, Chess, Color } from "chess.js";

import { PieceDetails, Position } from "../types";

import {
  CHAR_CODE_FOR_LETTER_A,
  NUMBER_OF_COLUMNS,
  BLACK_KING_SIDE_CASTLE_SQUARE,
  BLACK_KING_SIDE_ROOK_INITIAL_SQUARE,
  BLACK_QUEEN_SIDE_CASTLE_SQUARE,
  BLACK_QUEEN_SIDE_ROOK_INITIAL_SQUARE,
  WHITE_KING_SIDE_CASTLE_SQUARE,
  WHITE_KING_SIDE_ROOK_INITIAL_SQUARE,
  WHITE_QUEEN_SIDE_CASTLE_SQUARE,
  WHITE_QUEEN_SIDE_ROOK_INITIAL_SQUARE,
} from "../constants";

const animationDuration = 50;

// helper function to convert square notation to position
export function getXYFromSquare(square: string, width: number): Position {
  const file = square.charCodeAt(0) - CHAR_CODE_FOR_LETTER_A;
  const rank = NUMBER_OF_COLUMNS - parseInt(square.charAt(1), 10);
  return { x: file * width, y: rank * width };
}

// helper function to convert position to square notation
export function getSquareFromXY(position: Position, width: number): Square {
  const file = String.fromCharCode(CHAR_CODE_FOR_LETTER_A + Math.floor(position.x / width));
  const rank = NUMBER_OF_COLUMNS - Math.floor(position.y / width);
  return (file + rank) as Square;
}

export function isCaptureMove(move: Move): boolean {
  return move.flags.includes("c");
}
export function isEnpassantMove(move: Move): boolean {
  return move.flags.includes("e");
}
export function isPromotion(move: Move): boolean {
  return move.flags.includes("p");
}
export function isKingSideCastlingMove(move: Move) {
  return move.flags.includes("k");
}
export function isQueenSideCastlingMove(move: Move) {
  return move.flags.includes("q");
}

export function animateQueenSideCastle(rook: PieceDetails, pieceWidth: number) {
  const newPosition = getXYFromSquare(
    rook.color === "w" ?
      WHITE_QUEEN_SIDE_CASTLE_SQUARE
      : BLACK_QUEEN_SIDE_CASTLE_SQUARE,
    pieceWidth,
  );
  animatePieceToPosition(
    rook,
    newPosition,
  );
  return newPosition;
}
export function animateKingSideCastle(rook: PieceDetails, pieceWidth: number) {
  const newPosition = getXYFromSquare(
    rook.color === "w" ?
      WHITE_KING_SIDE_CASTLE_SQUARE
      : BLACK_KING_SIDE_CASTLE_SQUARE,
    pieceWidth
  );
  animatePieceToPosition(
    rook,
    newPosition
  );
  return newPosition;
}

export function animatePieceToPosition(piece: PieceDetails, position: Position, cb?: () => void) {
  Animated.timing(piece.animatedPosition, {
    toValue: position,
    duration: animationDuration,
    useNativeDriver: true,
  }).start(cb);
}

export function parsePieceMove(from: Position, to: Position, pieceWidth: number, pieces: PieceDetails[], game: Chess) {
  const toSquare = getSquareFromXY(to, pieceWidth);
  const fromSquare = getSquareFromXY(from, pieceWidth);
  const movedPiece = pieces
    .find(piece => piece.square === fromSquare && !piece.captured);
  const legalMoves = game
    .moves({ square: fromSquare, verbose: true });
  const legalMove = legalMoves
    .find((move) => move.to === toSquare);
  return {
    toSquare,
    movedPiece,
    legalMove
  };
}
export function revertMove(movedPiece: PieceDetails) {
  const initialPosition = movedPiece.position;
  return animatePieceToPosition(
    movedPiece,
    initialPosition,
  );
}
export function capturePiece(capturedPiece: PieceDetails, updatedPieces: PieceDetails[]): void {
  capturedPiece.opacity.setValue(0);
  updatedPieces.push({
    ...capturedPiece,
    captured: true,
  });
}

export function getKingSideRook(color: Color, pieces: PieceDetails[]): PieceDetails {
  const kingSideRook = pieces
    .find(
      (piece) => color === "w" ?
        piece.square === WHITE_KING_SIDE_ROOK_INITIAL_SQUARE :
        piece.square === BLACK_KING_SIDE_ROOK_INITIAL_SQUARE,
    );
  return kingSideRook;
}
export function getQueenSideRook(color: Color, pieces: PieceDetails[]): PieceDetails {
  return pieces
    .find(
      (piece) => color === "w" ?
        piece.square === WHITE_QUEEN_SIDE_ROOK_INITIAL_SQUARE :
        piece.square === BLACK_QUEEN_SIDE_ROOK_INITIAL_SQUARE,
    );
}

export function getEnPassantSquare(toSquare: Square, pieceWidth: number): Square {
  const toSquareXYCoordinate = getXYFromSquare(toSquare, pieceWidth);
  const enPassantSquareXYCoordinate = {
    ...toSquareXYCoordinate,
    y: ((toSquareXYCoordinate.y / pieceWidth) + 1) * pieceWidth,
  };
  return getSquareFromXY(enPassantSquareXYCoordinate, pieceWidth);
}
export function getPromotionSquare(fromSquare: Square, pieceWidth: number): Square {
  const fromSquareXYCoordinate = getXYFromSquare(fromSquare, pieceWidth);
  const promotionSquareXYCoordinate = {
    ...fromSquareXYCoordinate,
    y: ((fromSquareXYCoordinate.y / pieceWidth) - 1) * pieceWidth,
  };
  return getSquareFromXY(promotionSquareXYCoordinate, pieceWidth);
}

export function getNewPositionFromGesture(initialPosition: Position, gestureState: PanResponderGestureState, width: number) {
  const newX =
    Math.round((initialPosition.x + gestureState.dx) / width) * width;
  const newY =
    Math.round((initialPosition.y + gestureState.dy) / width) * width;
  const newPositon: Position = {
    x: newX,
    y: newY,
  };
  return newPositon;
}
