import { Square } from "chess.js";

const chessPiecesPath = "../../assets/chess_pieces/";
export const NUMBER_OF_COLUMNS = 8;
export const NUMBER_OF_ROWS = NUMBER_OF_COLUMNS;
export const CHAR_CODE_FOR_LETTER_A = 97;
export const WHITE_KING_SIDE_CASTLE_SQUARE: Square = "f1";
export const WHITE_QUEEN_SIDE_CASTLE_SQUARE: Square = "d1";
export const BLACK_KING_SIDE_CASTLE_SQUARE: Square = "f8";
export const BLACK_QUEEN_SIDE_CASTLE_SQUARE: Square = "d8";

export const WHITE_KING_SIDE_ROOK_INITIAL_SQUARE: Square = "h1";
export const WHITE_QUEEN_SIDE_ROOK_INITIAL_SQUARE: Square = "a1";
export const BLACK_KING_SIDE_ROOK_INITIAL_SQUARE: Square = "h8";
export const BLACK_QUEEN_SIDE_ROOK_INITIAL_SQUARE: Square = "a8";
export const PIECES = {
  bk: require(`${chessPiecesPath}bk.png`),
  bq: require(`${chessPiecesPath}bq.png`),
  br: require(`${chessPiecesPath}br.png`),
  bb: require(`${chessPiecesPath}bb.png`),
  bn: require(`${chessPiecesPath}bn.png`),
  bp: require(`${chessPiecesPath}bp.png`),
  wk: require(`${chessPiecesPath}wk.png`),
  wq: require(`${chessPiecesPath}wq.png`),
  wr: require(`${chessPiecesPath}wr.png`),
  wb: require(`${chessPiecesPath}wb.png`),
  wn: require(`${chessPiecesPath}wn.png`),
  wp: require(`${chessPiecesPath}wp.png`),
};

