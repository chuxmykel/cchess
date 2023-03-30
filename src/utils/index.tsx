import { Square, Move } from "chess.js";

import { Position } from "../types";

// helper function to convert square notation to position
export function getXYFromSquare(square: string, width: number): Position {
  // debugger;
  const file = square.charCodeAt(0) - 97;
  const rank = 8 - parseInt(square.charAt(1), 10);
  return { x: file * width, y: rank * width };
}

// helper function to convert position to square notation
export function getSquareFromXY(position: Position, width): Square {
  const file = String.fromCharCode(97 + Math.floor(position.x / width));
  const rank = 8 - Math.floor(position.y / width);
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
