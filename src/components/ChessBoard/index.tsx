import { memo, useCallback, useLayoutEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { Color, Square } from 'chess.js';

import { NUMBER_OF_ROWS } from '../../constants';
import { getXYFromSquare } from '../../domain/boardCoordinates';
import { usePieceAnimations } from '../../hooks/usePieceAnimations';
import { useDragGuide } from '../../hooks/useDragGuide';
import { lastMoveSquares, PlayedMove } from '../../domain/lastMoveSquares';
import { logDrag } from '../../utils/dragLog';
import { useValidMoveIndicators } from '../../hooks/useValidMoveIndicators';
import { useChessGameContext } from '../../context/ChessGameContext';

import BoardSurface from './BoardSurface';
import LastMoveHighlight from './LastMoveHighlight';
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
  // Slide pieces to their squares, rather than put them there at once - a
  // bullet game has no time to watch them go.
  animate?: boolean;
  // The last move the game has a record of, marked until the board makes
  // one itself - on a game resumed, say, or put back after a move refused.
  lastPlayedMove?: PlayedMove | null;
}

const Chessboard: React.FC<ChessboardProps> = ({
  colors,
  width,
  orientation = 'w',
  animate = true,
  lastPlayedMove = null,
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
    animate,
  );
  const markedMove = lastMove ?? lastPlayedMove;
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

  // A piece a drop took is hidden until the game moves on from that move -
  // made, or refused and the board put back.
  const { taken } = dragGuide;
  useLayoutEffect(() => {
    const drop = taken.get();
    if (drop && (lastMove?.from !== drop.from || lastMove?.to !== drop.to)) {
      taken.set(null);
    }
  }, [taken, lastMove]);

  const handleDragRelease = useCallback(
    (from: Square, to: Square) => {
      const { attemptMove, animatedPieces, PIECE_WIDTH } = latest.current;
      const draggedPiece = animatedPieces.find(
        (piece) => piece.square === from,
      );
      const result = attemptMove(from, to);
      logDrag(`game ${from}->${to} ${result.status}`);
      // Not made yet - or not a move at all: whatever the drop took is back.
      if (result.status !== 'ok') taken.set(null);
      // Not a move after all: the drop already sent the piece home if it
      // looked illegal there, but this is the final word - home at once, as
      // a drop is set down.
      if (result.status === 'illegal' && draggedPiece) {
        const home = getXYFromSquare(from, PIECE_WIDTH);
        draggedPiece.x.set(home.x);
        draggedPiece.y.set(home.y);
      }
    },
    [taken],
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
        onSquarePress={handleTap}
      />

      <LastMoveHighlight
        move={markedMove && lastMoveSquares(markedMove)}
        squareWidth={PIECE_WIDTH}
        orientation={orientation}
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
