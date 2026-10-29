import { memo } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Color } from 'chess.js';

import { NUMBER_OF_ROWS, PIECES } from '../../../constants';
import {
  PositionPieceView,
  usePositionPieces,
} from '../../../hooks/usePositionPieces';
import { MoveSquares } from '../../../domain/types';
import BoardSurface from '../BoardSurface';
import LastMoveHighlight from '../LastMoveHighlight';

interface StaticBoardProps {
  fen: string;
  colors: {
    light: string;
    dark: string;
  };
  width: number;
  orientation?: Color;
  /** The move that led to this position, marked on the board. */
  lastMove?: MoveSquares | null;
  /** Slide the pieces to a new position, rather than put them there. */
  animate?: boolean;
  /** Once the pieces are all in a new position. */
  onSettled?: () => void;
}

const StaticPiece = memo(function StaticPiece({
  piece,
  width,
  orientation,
}: {
  piece: PositionPieceView;
  width: number;
  orientation: Color;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: piece.x.get() },
      { translateY: piece.y.get() },
    ] as const,
  }));
  return (
    <Animated.View
      style={[styles.piece, animatedStyle]}
      testID={`piece-${piece.square}`}
    >
      <Image
        source={PIECES[piece.spriteId]}
        fadeDuration={0}
        style={[
          { width, height: width },
          // Upright again, on a board turned round for black.
          orientation === 'b' && styles.turned,
        ]}
      />
    </Animated.View>
  );
});

// A read-only board drawn from a FEN, with no game behind it - a game looked
// back on. Its pieces stay the same pieces from one position to the next,
// moving to their new squares (see usePositionPieces).
const StaticBoard: React.FC<StaticBoardProps> = ({
  fen,
  colors,
  width,
  orientation = 'w',
  lastMove = null,
  animate = false,
  onSettled,
}) => {
  const pieceWidth = width / NUMBER_OF_ROWS;
  const pieces = usePositionPieces(fen, pieceWidth, animate, onSettled);

  return (
    <View
      style={{ width, height: width }}
      pointerEvents="none"
      testID="static-chessboard"
    >
      <BoardSurface colors={colors} orientation={orientation} />
      <LastMoveHighlight
        move={lastMove}
        squareWidth={pieceWidth}
        orientation={orientation}
      />
      {/* Placed from white's side, and turned round for black, as on the
          live board - so a flip is drawn at once, with nothing moving. */}
      <View
        style={[StyleSheet.absoluteFill, orientation === 'b' && styles.turned]}
        testID="static-pieces-layer"
      >
        {pieces.map((piece) => (
          <StaticPiece
            key={piece.id}
            piece={piece}
            width={pieceWidth}
            orientation={orientation}
          />
        ))}
      </View>
    </View>
  );
};

export default StaticBoard;

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
  },
  turned: {
    transform: [{ rotate: '180deg' }],
  },
});
