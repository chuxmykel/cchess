import { useMemo } from 'react';
import { Color } from 'chess.js';

import { Chessboard } from '../../lib/chessboard';
import { kingInDanger } from '../../domain/kingInDanger';
import { MoveSquares } from '../../domain/types';
import { useChessboardColors } from './boardStyle';
import { usePieceSet } from './pieceSets';

interface PositionBoardProps {
  fen: string;
  width: number;
  orientation?: Color;
  /** The move that led to this position, marked on the board. */
  lastMove?: MoveSquares | null;
  /** Slide the pieces to a new position, rather than put them there. */
  animate?: boolean;
  /** Once the pieces are all in a new position. */
  onSettled?: () => void;
  /** The side that lost, when this is the game's last position. */
  defeated?: Color | null;
}

// A read-only board drawn from a FEN, with no game behind it - a game looked
// back on. Its pieces stay the same pieces from one position to the next,
// moving to their new squares.
const PositionBoard: React.FC<PositionBoardProps> = ({
  fen,
  width,
  orientation = 'w',
  lastMove = null,
  animate = false,
  onSettled,
  defeated = null,
}) => {
  const colors = useChessboardColors();
  const pieceSet = usePieceSet();
  const check = useMemo(() => kingInDanger(fen, defeated), [fen, defeated]);
  const animation = useMemo(
    () => ({ enabled: animate, slideOnSet: true }),
    [animate],
  );

  return (
    <Chessboard
      fen={fen}
      size={width}
      orientation={orientation}
      colors={colors}
      pieceSet={pieceSet}
      lastMove={lastMove}
      check={check}
      animation={animation}
      onSettled={onSettled}
      viewOnly
      testID="static-chessboard"
    />
  );
};

export default PositionBoard;
