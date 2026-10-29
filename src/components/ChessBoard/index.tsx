import { memo, useCallback, useLayoutEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { Color, Square } from 'chess.js';

import { NUMBER_OF_ROWS } from '../../constants';
import { SNAP_BACK_TIMING } from '../../constants/animations';
import { getXYFromSquare } from '../../domain/boardCoordinates';
import {
  animatePieceTo,
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

  // What the pieces' callbacks call, as it is now. The callbacks themselves
  // never change: a game hands over new functions every time it renders -
  // on every server push - and a piece given a new callback re-renders, and
  // re-rendering a piece makes Gesture Handler set its gestures up again,
  // cancelling a drag that's under way.
  const latest = useRef({
    attemptMove,
    handleSquareTap,
    showFor,
    animatedPieces,
    PIECE_WIDTH,
  });
  useLayoutEffect(() => {
    latest.current = {
      attemptMove,
      handleSquareTap,
      showFor,
      animatedPieces,
      PIECE_WIDTH,
    };
  });

  const handleTap = useCallback((square: Square) => {
    latest.current.handleSquareTap(square);
  }, []);

  const handleDragStart = useCallback((square: Square) => {
    latest.current.showFor(square);
  }, []);

  const handleDragRelease = useCallback((from: Square, to: Square) => {
    const { attemptMove, animatedPieces, PIECE_WIDTH } = latest.current;
    const draggedPiece = animatedPieces.find((piece) => piece.square === from);
    const result = attemptMove(from, to);
    // Not a move after all: the drop already sent the piece home if it
    // looked illegal there, but this is the final word.
    if (result.status === 'illegal' && draggedPiece) {
      animatePieceTo(
        draggedPiece,
        getXYFromSquare(from, PIECE_WIDTH),
        SNAP_BACK_TIMING,
      );
    }
  }, []);

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
        onSquarePress={handleTap}
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

      {/* The pieces are placed from white's side; for black, the whole layer
          is turned round - in the same frame as the squares, since it's
          plain style rather than each piece's position catching up. */}
      <View
        pointerEvents="box-none"
        style={[StyleSheet.absoluteFill, orientation === 'b' && styles.turned]}
        testID="pieces-layer"
      >
        <Pieces
          pieces={animatedPieces}
          pieceWidth={PIECE_WIDTH}
          orientation={orientation}
          isOwnPieceAt={isOwnPieceAt}
          locked={isGameOver}
          legalTargets={legalTargetsOnUI}
          dragGuide={dragGuide}
          onTap={handleTap}
          onDragStart={handleDragStart}
          onDragRelease={handleDragRelease}
        />
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  turned: {
    transform: [{ rotate: '180deg' }],
  },
});

// A screen around the board can re-render often - a game's clock ticks ten
// times a second - and the board needn't follow it: every piece's gestures
// are rebuilt on a render, which keeps the JS thread busy enough to hold up a
// drop reaching it. It re-renders for its own props and the game's state.
export default memo(Chessboard);
