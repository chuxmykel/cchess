import { PieceSymbol, Square } from 'chess.js';

import { MoveSquares } from './types';

// A move played, as far as marking it needs: which piece, from where, to where.
export type PlayedMove = MoveSquares & { piece: PieceSymbol };

// The squares a board marks for the last move: where the piece left and
// where it landed - but for a castle, the king's and the rook's starting
// squares, as lichess and chess.com do, for either side.
export function lastMoveSquares({ from, to, piece }: PlayedMove): MoveSquares {
  const files = to.charCodeAt(0) - from.charCodeAt(0);
  // Only castling moves a king two files.
  if (piece !== 'k' || Math.abs(files) !== 2) return { from, to };
  const rookFile = files > 0 ? 'h' : 'a';
  return { from, to: `${rookFile}${from[1]}` as Square };
}
