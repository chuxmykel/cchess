import { memo, useCallback, useMemo } from 'react';
import { Color, Square } from 'chess.js';

import { BoardArrow, Chessboard } from '../../lib/chessboard';
import { PIECES } from '../../constants';
import { useChessGameContext } from '../../context/ChessGameContext';
import { kingInDanger } from '../../domain/kingInDanger';
import { lastMoveSquares, PlayedMove } from '../../domain/lastMoveSquares';
import { DRAG_LOG_ENABLED, logDrag } from '../../utils/dragLog';
import { useChessboardColors } from './boardStyle';

interface GameBoardProps {
  width: number;
  // Whose side of the board is at the bottom; defaults to white's.
  orientation?: Color;
  // Slide pieces to their squares, rather than put them there at once - a
  // bullet game has no time to watch them go.
  animate?: boolean;
  // The last move the game has a record of, marked until the board makes
  // one itself - on a game resumed, say, or put back after a move refused.
  lastPlayedMove?: PlayedMove | null;
  // The side that lost the game, whose king falls.
  defeated?: Color | null;
  // Slide the pieces into a position the game was put in without a move -
  // stepping back through an analysis - rather than put them straight there.
  slideOnReset?: boolean;
  arrows?: BoardArrow[];
}

// The board for a game being played, from ChessGameContext: the side that
// can move picks up its pieces, and a move goes to the game, which judges it.
const GameBoard: React.FC<GameBoardProps> = ({
  width,
  orientation = 'w',
  animate = true,
  lastPlayedMove = null,
  defeated = null,
  slideOnReset = false,
  arrows,
}) => {
  const {
    fen,
    movableColor,
    legalTargets,
    pendingPromotion,
    lastMove,
    attemptMove,
  } = useChessGameContext();
  const colors = useChessboardColors();

  const movable = useMemo(
    () => ({ color: movableColor, dests: legalTargets }),
    [movableColor, legalTargets],
  );
  const played = lastMove ?? lastPlayedMove;
  const markedMove = useMemo(() => played && lastMoveSquares(played), [played]);
  const check = useMemo(() => kingInDanger(fen, defeated), [fen, defeated]);
  const animation = useMemo(
    () => ({ enabled: animate, slideOnSet: slideOnReset }),
    [animate, slideOnReset],
  );

  const handleMove = useCallback(
    (from: Square, to: Square) => {
      const result = attemptMove(from, to);
      logDrag(`game ${from}->${to} ${result.status}`);
      return result.status !== 'illegal';
    },
    [attemptMove],
  );

  return (
    <Chessboard
      fen={fen}
      size={width}
      orientation={orientation}
      colors={colors}
      pieceImages={PIECES}
      movable={movable}
      onMove={handleMove}
      lastMove={markedMove}
      promotion={pendingPromotion}
      check={check}
      arrows={arrows}
      animation={animation}
      onDragLog={DRAG_LOG_ENABLED ? logDrag : undefined}
      testID="chessboard"
    />
  );
};

// A screen around the board can re-render often - a game's clock ticks ten
// times a second - and the board needn't follow it: it re-renders for its
// own props and the game's state.
export default memo(GameBoard);
