import { Color, Square } from 'chess.js';

import { Position } from './types';

// Pure square <-> pixel math - a standard chessboard is always 8x8, so these
// are domain constants in their own right, independent of the UI's board
// size/asset constants.
//
// `orientation` is whose side of the board sits at the bottom of the screen:
// 'w' puts a1 bottom-left (rank 8 on top), 'b' mirrors both axes so h8 is
// bottom-left (rank 1 on top). Both functions must always be called with the
// same orientation, or a square won't round-trip back to itself.
const CHAR_CODE_FOR_LETTER_A = 97;
const NUMBER_OF_COLUMNS = 8;

export function getXYFromSquare(
  square: string,
  width: number,
  orientation: Color = 'w',
): Position {
  const file = square.charCodeAt(0) - CHAR_CODE_FOR_LETTER_A;
  const rank = parseInt(square.charAt(1), 10);
  if (orientation === 'b') {
    return {
      x: (NUMBER_OF_COLUMNS - 1 - file) * width,
      y: (rank - 1) * width,
    };
  }
  return { x: file * width, y: (NUMBER_OF_COLUMNS - rank) * width };
}

export function getSquareFromXY(
  position: Position,
  width: number,
  orientation: Color = 'w',
): Square {
  const column = Math.floor(position.x / width);
  const row = Math.floor(position.y / width);
  if (orientation === 'b') {
    const file = String.fromCharCode(
      CHAR_CODE_FOR_LETTER_A + (NUMBER_OF_COLUMNS - 1 - column),
    );
    return (file + (row + 1)) as Square;
  }
  const file = String.fromCharCode(CHAR_CODE_FOR_LETTER_A + column);
  return (file + (NUMBER_OF_COLUMNS - row)) as Square;
}
