import { ChessEngine } from './ChessEngine';
import { DomainPiece } from './types';

export function plyCountFromFen(fen: string): number {
  const [, sideToMove, , , , fullmoveNumber] = fen.split(' ');
  return (Number(fullmoveNumber) - 1) * 2 + (sideToMove === 'b' ? 1 : 0);
}

export function piecesFromFen(fen: string): DomainPiece[] {
  return new ChessEngine(fen).getBoardSnapshot();
}
