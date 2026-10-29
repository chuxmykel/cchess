import { useCallback } from 'react';
import { Animated, View } from 'react-native';
import { Color, Square } from 'chess.js';

import { NUMBER_OF_ROWS } from '../../constants';
import { REST_THRESHOLDS, SNAP_BACK_SPRING } from '../../constants/animations';
import { Position } from '../../domain/types';
import { getXYFromSquare } from '../../domain/boardCoordinates';
import { usePieceAnimations } from '../../hooks/usePieceAnimations';
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
  const dragGuide = useDragGuide(PIECE_WIDTH);
  const { updatePosition } = dragGuide;
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
      // Not a move: the piece slides home from where it was dropped.
      if (result.status === 'illegal' && draggedPiece) {
        Animated.spring(draggedPiece.animatedPosition, {
          toValue: getXYFromSquare(from, PIECE_WIDTH, orientation),
          ...SNAP_BACK_SPRING,
          ...REST_THRESHOLDS,
          useNativeDriver: true,
        }).start();
      }
    },
    [animatedPieces, attemptMove, PIECE_WIDTH, orientation],
  );

  const handleDrag = useCallback(
    (position: Position) => {
      updatePosition(position);
    },
    [updatePosition],
  );

  return (
    <View style={{ width, height: width }} testID="chessboard">
      <BoardSurface
        colors={colors}
        orientation={orientation}
        onSquarePress={handleSquareTap}
      />

      <PieceDragAndDropGuide
        boardWidth={width}
        squareWidth={PIECE_WIDTH}
        position={dragGuide.position}
        opacity={dragGuide.opacity}
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
        onTap={handleSquareTap}
        onDragStart={handleDragStart}
        onDragRelease={handleDragRelease}
        onDrag={handleDrag}
        showDragGuide={dragGuide.show}
        hideDragGuide={dragGuide.hide}
      />
    </View>
  );
};

export default Chessboard;
