// The app's boards: the only code that uses the chessboard library
// (src/lib/chessboard), mapping the app's games, theme and pieces onto it -
// so another board library would be swapped in here alone.
export { default as GameBoard } from './GameBoard';
export { default as PositionBoard } from './PositionBoard';
export { default as EmptyBoard } from './EmptyBoard';
export { default as SetupBoard } from './SetupBoard';
export { default as BoardPieceIcon } from './BoardPieceIcon';
export type { BoardArrow } from '../../lib/chessboard';
