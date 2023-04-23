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

export const squares: Square[] = ['a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8', 'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7', 'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6', 'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5', 'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4', 'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3', 'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2', 'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'];

