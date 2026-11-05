import { Color, PieceSymbol } from 'chess.js';

import { ChessPiece } from '../../lib/chessboard';
import { usePieceSet } from './pieceSets';

interface BoardPieceIconProps {
  color: Color;
  type: PieceSymbol;
  size: number;
  // Drawn in this one color, a silhouette, rather than in its own.
  tint?: string;
  accessibilityLabel?: string;
  testID?: string;
}

// A piece drawn off the board - a promotion's choices, the pieces taken - in
// the set the boards use.
const BoardPieceIcon: React.FC<BoardPieceIconProps> = ({
  color,
  type,
  size,
  tint,
  accessibilityLabel,
  testID,
}) => {
  const pieceSet = usePieceSet();
  return (
    <ChessPiece
      piece={`${color}${type}`}
      size={size}
      pieceSet={pieceSet}
      color={tint}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    />
  );
};

export default BoardPieceIcon;
