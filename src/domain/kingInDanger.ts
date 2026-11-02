import { Color } from 'chess.js';

import { ChessEngine } from './ChessEngine';
import { KingInDanger } from './types';

// The king a board marks in danger: the side that lost the game, however it
// lost - mated, on time, resigning - fallen; or else, the side to move's
// king in check, fallen only if it's mate (so a mate shows while stepping
// through a game too).
export function kingInDanger(
  fen: string,
  defeated: Color | null = null,
): KingInDanger | null {
  const engine = new ChessEngine(fen);
  if (defeated) {
    const square = engine.getKingSquare(defeated);
    return square && { square, fallen: true };
  }
  if (!engine.isCheck()) return null;
  return {
    square: engine.getKingSquare(engine.getTurn()),
    fallen: engine.isCheckmate(),
  };
}
