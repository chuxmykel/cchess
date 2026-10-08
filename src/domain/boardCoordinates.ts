import { Square } from 'chess.js';

import { Position } from './types';

// Pure square <-> pixel math - a standard chessboard is always 8x8, so these
// are domain constants in their own right, independent of the UI's board
// size/asset constants.
const CHAR_CODE_FOR_LETTER_A = 97;
const NUMBER_OF_COLUMNS = 8;

export function getXYFromSquare(square: string, width: number): Position {
  const file = square.charCodeAt(0) - CHAR_CODE_FOR_LETTER_A;
  const rank = NUMBER_OF_COLUMNS - parseInt(square.charAt(1), 10);
  return { x: file * width, y: rank * width };
}

export function getSquareFromXY(position: Position, width: number): Square {
  const file = String.fromCharCode(
    CHAR_CODE_FOR_LETTER_A + Math.floor(position.x / width),
  );
  const rank = NUMBER_OF_COLUMNS - Math.floor(position.y / width);
  return (file + rank) as Square;
}
