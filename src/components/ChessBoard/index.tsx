import { useCallback } from 'react';
import { View } from 'react-native';
import { Square } from 'chess.js';

import { NUMBER_OF_ROWS } from '../../constants';
import { Position } from '../../domain/types';
import { getXYFromSquare } from '../../domain/boardCoordinates';
import { usePieceAnimations } from '../../hooks/usePieceAnimations';
import { useDragGuide } from '../../hooks/useDragGuide';
import { useValidMoveIndicators } from '../../hooks/useValidMoveIndicators';
import { useChessGameContext } from '../../screens/Game/ChessGameContext';

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
}

const Chessboard: React.FC<ChessboardProps> = ({ colors, width }) => {
  const {
    pieces,
    isGameOver,
    legalMoveSquares,
    lastMove,
    isOwnPieceAt,
    getLegalMoveSquares,
    handleSquareTap,
    attemptMove,
  } = useChessGameContext();
  const PIECE_WIDTH = width / NUMBER_OF_ROWS;
  const animatedPieces = usePieceAnimations(pieces, lastMove, PIECE_WIDTH);
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
      if (result.status === 'illegal' && draggedPiece) {
        draggedPiece.animatedPosition.setValue(
          getXYFromSquare(from, PIECE_WIDTH),
        );
      }
    },
    [animatedPieces, attemptMove, PIECE_WIDTH],
  );

  const handleDrag = useCallback(
    (position: Position) => {
      updatePosition(position);
    },
    [updatePosition],
  );

  return (
    <View style={{ width, height: width }} testID="chessboard">
      <BoardSurface colors={colors} onSquarePress={handleSquareTap} />

      <PieceDragAndDropGuide
        boardWidth={width}
        squareWidth={PIECE_WIDTH}
        position={dragGuide.position}
        opacity={dragGuide.opacity}
      />

      <ValidMoveIndicators
        pieceWidth={PIECE_WIDTH}
        opacities={validMoveIndicators.opacities}
      />

      <Pieces
        pieces={animatedPieces}
        pieceWidth={PIECE_WIDTH}
        isOwnPieceAt={isOwnPieceAt}
        isGameOver={isGameOver}
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
