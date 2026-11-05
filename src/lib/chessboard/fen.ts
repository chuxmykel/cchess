import { BoardPiece, Color, PieceSymbol, Square } from './types';

const PIECE_SYMBOLS = new Set(['p', 'n', 'b', 'r', 'q', 'k']);

// The pieces a FEN's placement field puts on the board, rank 8 first. Only
// the placement is read, and any placement is drawn - one with no kings, or
// pawns on the back rank, as a position being set up can have. Anything it
// can't make sense of is left off.
export function parsePlacement(fen: string): BoardPiece[] {
  const [placement = ''] = fen.trim().split(/\s+/);
  const pieces: BoardPiece[] = [];
  placement
    .split('/')
    .slice(0, 8)
    .forEach((row, index) => {
      const rank = 8 - index;
      let file = 0;
      for (const char of row) {
        if (/[1-8]/.test(char)) {
          file += Number(char);
          continue;
        }
        const type = char.toLowerCase();
        if (file < 8 && PIECE_SYMBOLS.has(type)) {
          pieces.push({
            square: `${String.fromCharCode(97 + file)}${rank}` as Square,
            color: (char === type ? 'b' : 'w') as Color,
            type: type as PieceSymbol,
          });
        }
        file += 1;
      }
    });
  return pieces;
}
