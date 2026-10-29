import { useCallback, useLayoutEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { Color, Square } from 'chess.js';

import { NUMBER_OF_ROWS } from '../../constants';
import { SNAP_BACK_SPRING } from '../../constants/animations';
import { getXYFromSquare } from '../../domain/boardCoordinates';
import {
  springPieceTo,
  usePieceAnimations,
} from '../../hooks/usePieceAnimations';
import { useDragGuide } from '../../hooks/useDragGuide';
import { useValidMoveIndicators } from '../../hooks/useValidMoveIndicators';
import { useChessGameContext } from '../../context/ChessGameContext';

import BoardSurface from './BoardSurface';
import Pieces from './Pieces';
import PieceDragAndDropGuide from './PieceDragAndDropGuide';
import ValidMoveIndicators from './ValidMoveIndicators';

interface ChessboardProps {
  colors: {
    light: string;
    dark: string;
  };
  width: number;
  // Whose side of the board is at the bottom; defaults to white's.
  orientation?: Color;
}

const Chessboard: React.FC<ChessboardProps> = ({
  colors,
  width,
  orientation = 'w',
}) => {
  const {
    pieces,
    isGameOver,
    legalMoveSquares,
    lastMove,
    legalTargets,
    pendingPromotion,
    isOwnPieceAt,
    getLegalMoveSquares,
    handleSquareTap,
    attemptMove,
  } = useChessGameContext();
  const PIECE_WIDTH = width / NUMBER_OF_ROWS;
  const animatedPieces = usePieceAnimations(
    pieces,
    lastMove,
    PIECE_WIDTH,
    orientation,
    pendingPromotion,
  );
  const dragGuide = useDragGuide();
  // For a drop to be judged where it lands, on the UI thread.
  const legalTargetsOnUI = useSharedValue(legalTargets);
  useLayoutEffect(() => {
    legalTargetsOnUI.set(legalTargets);
  }, [legalTargetsOnUI, legalTargets]);
  const validMoveIndicators = useValidMoveIndicators(
    legalMoveSquares,
    getLegalMoveSquares,
  );
  const { showFor } = validMoveIndicators;

  const handleDragStart = useCallback(
    (square: Square) => {
      showFor(square);
    },
    [showFor],
  );

  const handleDragRelease = useCallback(
    (from: Square, to: Square) => {
      const draggedPiece = animatedPieces.find(
        (piece) => piece.square === from,
      );
      const result = attemptMove(from, to);
      // Not a move after all: the drop already sent the piece home if it
      // looked illegal there, but this is the final word.
      if (result.status === 'illegal' && draggedPiece) {
        springPieceTo(
          draggedPiece,
          getXYFromSquare(from, PIECE_WIDTH, orientation),
          SNAP_BACK_SPRING,
        );
      }
    },
    [animatedPieces, attemptMove, PIECE_WIDTH, orientation],
  );

  return (
    // Its own root for the pieces' gestures, so the board works wherever it's
    // rendered, as Gesture Handler suggests for a component that uses them.
    <GestureHandlerRootView
      style={{ width, height: width }}
      testID="chessboard"
    >
      <BoardSurface
        colors={colors}
        orientation={orientation}
        onSquarePress={handleSquareTap}
      />

      <PieceDragAndDropGuide
        boardWidth={width}
        squareWidth={PIECE_WIDTH}
        guide={dragGuide}
      />

      <ValidMoveIndicators
        pieceWidth={PIECE_WIDTH}
        orientation={orientation}
        opacities={validMoveIndicators.opacities}
      />

      <Pieces
        pieces={animatedPieces}
        pieceWidth={PIECE_WIDTH}
        orientation={orientation}
        isOwnPieceAt={isOwnPieceAt}
        locked={isGameOver}
        legalTargets={legalTargetsOnUI}
        dragGuide={dragGuide}
        onTap={handleSquareTap}
        onDragStart={handleDragStart}
        onDragRelease={handleDragRelease}
      />
    </GestureHandlerRootView>
  );
};

export default Chessboard;
