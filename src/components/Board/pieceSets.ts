import { defaultPieceSet, PieceSet } from '../../lib/chessboard';
import { PieceSetName } from '../../constants/appearance';
import { usePieceSetName } from '../../theme';

// Each piece set Appearance offers, drawn: the board library's own, and any
// of the app's (scripts/generate-pieces.js draws the library's).
export const PIECE_SETS: Record<PieceSetName, PieceSet> = {
  standard: defaultPieceSet,
};

// The pieces chosen in Appearance, for every board and every piece drawn off
// one, so they all match.
export function usePieceSet(): PieceSet {
  return PIECE_SETS[usePieceSetName()];
}
