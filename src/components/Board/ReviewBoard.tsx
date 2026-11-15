import { memo, useMemo } from 'react';
import { Color, Square } from 'chess.js';

import {
  BoardArrow,
  Chessboard,
  Movable,
  SquareBadge,
} from '../../lib/chessboard';
import { ChessEngine } from '../../domain/ChessEngine';
import { kingInDanger } from '../../domain/kingInDanger';
import type { MoveClass } from '../../domain/review/types';
import { MoveSquares } from '../../domain/types';
import { useTheme } from '../../theme';
import { alphaColor } from '../../utils/color';
import { MoveClassMark } from '../MoveClassIcon';
import { useChessboardColors } from './boardStyle';
import { usePieceSet } from './pieceSets';

interface ReviewBoardProps {
  fen: string;
  width: number;
  orientation?: Color;
  // The move that led here, marked in its class's color, its badge on the
  // square it went to.
  lastMove?: MoveSquares | null;
  moveClass?: MoveClass | null;
  arrows?: BoardArrow[];
  // The side whose move is wanted - a review's Retry - its pieces movable to
  // wherever's legal; null draws the board only.
  movableColor?: Color | null;
  onMove?: (from: Square, to: Square) => void;
  defeated?: Color | null;
}

// A game review's board: the position at a move, that move marked in its
// class's color with the class's badge on its square, and the engine's
// arrows - or, to retry a move, the position before it, ready to be played.
const ReviewBoard: React.FC<ReviewBoardProps> = ({
  fen,
  width,
  orientation = 'w',
  lastMove = null,
  moveClass = null,
  arrows,
  movableColor = null,
  onMove,
  defeated = null,
}) => {
  const baseColors = useChessboardColors();
  const { colors: theme } = useTheme();
  const pieceSet = usePieceSet();
  const colors = useMemo(
    () =>
      moveClass
        ? {
            ...baseColors,
            lastMove: alphaColor(theme.moveClass[moveClass], 0.5),
          }
        : baseColors,
    [baseColors, moveClass, theme],
  );
  const badges = useMemo<SquareBadge[]>(
    () =>
      lastMove && moveClass
        ? [
            {
              square: lastMove.to,
              color: theme.moveClass[moveClass],
              content: (
                <MoveClassMark
                  moveClass={moveClass}
                  size={(width / 8) * 0.42}
                />
              ),
            },
          ]
        : [],
    [lastMove, moveClass, theme, width],
  );
  const movable = useMemo<Movable | null>(
    () =>
      movableColor
        ? {
            color: movableColor,
            dests: new ChessEngine(fen).getLegalTargets(),
          }
        : null,
    [fen, movableColor],
  );
  const check = useMemo(() => kingInDanger(fen, defeated), [fen, defeated]);
  const animation = useMemo(() => ({ enabled: true, slideOnSet: true }), []);

  return (
    <Chessboard
      fen={fen}
      size={width}
      orientation={orientation}
      colors={colors}
      pieceSet={pieceSet}
      lastMove={lastMove}
      check={check}
      arrows={arrows}
      squareBadges={badges}
      movable={movable}
      onMove={onMove}
      animation={animation}
      viewOnly={!movable}
      testID="review-board"
    />
  );
};

export default memo(ReviewBoard);
