import { Square } from 'chess.js';

const chessPiecesPath = '../../assets/chess_pieces/';

export const NUMBER_OF_COLUMNS = 8;
export const NUMBER_OF_ROWS = NUMBER_OF_COLUMNS;
export const WHITE_KING_SIDE_CASTLE_SQUARE: Square = 'f1';
export const WHITE_QUEEN_SIDE_CASTLE_SQUARE: Square = 'd1';
export const BLACK_KING_SIDE_CASTLE_SQUARE: Square = 'f8';
export const BLACK_QUEEN_SIDE_CASTLE_SQUARE: Square = 'd8';

export const WHITE_KING_SIDE_ROOK_INITIAL_SQUARE: Square = 'h1';
export const WHITE_QUEEN_SIDE_ROOK_INITIAL_SQUARE: Square = 'a1';
export const BLACK_KING_SIDE_ROOK_INITIAL_SQUARE: Square = 'h8';
export const BLACK_QUEEN_SIDE_ROOK_INITIAL_SQUARE: Square = 'a8';
// Metro resolves these template-literal require() calls just fine (verified
// via `npx expo export`), but @typescript-eslint/no-require-imports doesn't
// special-case React Native's require()-for-images convention, and ESM
// `import` isn't viable here since the filename is dynamic.
/* eslint-disable @typescript-eslint/no-require-imports */
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
/* eslint-enable @typescript-eslint/no-require-imports */
