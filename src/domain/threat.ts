import { Chess } from 'chess.js';

// The position with the move passed to the other side, so the engine says
// what they threaten - what they'd play if it were their turn. Null when the
// side to move is in check: passing then would leave a king to be taken.
export function nullMoveFen(fen: string): string | null {
  if (new Chess(fen).isCheck()) return null;
  const [board, turn, castling, , halfmoves, fullmoves] = fen.split(' ');
  const next = [
    board,
    turn === 'w' ? 'b' : 'w',
    castling,
    '-',
    String(Number(halfmoves) + 1),
    String(Number(fullmoves) + (turn === 'b' ? 1 : 0)),
  ].join(' ');
  try {
    return new Chess(next).fen();
  } catch {
    return null;
  }
}
