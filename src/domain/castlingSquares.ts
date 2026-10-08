import { Square } from 'chess.js';

// Where each rook starts, and where it lands once castled - domain facts
// about the rules of castling, independent of how/whether the UI animates them.
export const WHITE_KING_SIDE_ROOK_INITIAL_SQUARE: Square = 'h1';
export const WHITE_KING_SIDE_ROOK_CASTLED_SQUARE: Square = 'f1';
export const WHITE_QUEEN_SIDE_ROOK_INITIAL_SQUARE: Square = 'a1';
export const WHITE_QUEEN_SIDE_ROOK_CASTLED_SQUARE: Square = 'd1';

export const BLACK_KING_SIDE_ROOK_INITIAL_SQUARE: Square = 'h8';
export const BLACK_KING_SIDE_ROOK_CASTLED_SQUARE: Square = 'f8';
export const BLACK_QUEEN_SIDE_ROOK_INITIAL_SQUARE: Square = 'a8';
export const BLACK_QUEEN_SIDE_ROOK_CASTLED_SQUARE: Square = 'd8';
