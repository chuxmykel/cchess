import { Color } from 'chess.js';

import { Chessboard } from '../../lib/chessboard';
import { useChessboardColors } from './boardStyle';

const EMPTY_BOARD = '8/8/8/8/8/8/8/8';

interface EmptyBoardProps {
  width: number;
  orientation?: Color;
}

// The board's squares and nothing on them - while a game is on its way.
const EmptyBoard: React.FC<EmptyBoardProps> = ({
  width,
  orientation = 'w',
}) => {
  const colors = useChessboardColors();
  return (
    <Chessboard
      fen={EMPTY_BOARD}
      size={width}
      orientation={orientation}
      colors={colors}
      viewOnly
      testID="empty-chessboard"
    />
  );
};

export default EmptyBoard;
