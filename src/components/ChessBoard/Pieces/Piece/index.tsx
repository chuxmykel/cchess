import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Color, Square } from 'chess.js';

import { DragGuide } from '../../../../hooks/useDragGuide';
import { LegalTargets } from '../../../../domain/types';
import {
  MovableSquares,
  usePieceGesture,
} from '../../../../hooks/usePieceGesture';
import PieceImage from '../../PieceImage';

interface PieceProps {
  id: string;
  square: Square;
  width: number;
  orientation: Color;
  x: SharedValue<number>;
  y: SharedValue<number>;
  disabled: boolean;
  // Just taken, and only still shown until the piece taking it lands.
  captured: boolean;
  // A king in danger, and whether it has fallen (see PieceImage).
  inDanger?: boolean;
  fallen?: boolean;
  legalTargets: SharedValue<LegalTargets>;
  movable: SharedValue<MovableSquares>;
  dragGuide: DragGuide;
  onTap: (square: Square) => void;
  onDragRelease: (from: Square, to: Square) => void;
  onDragStart: (square: Square) => void;
}

const Piece: React.FC<PieceProps> = (props) => {
  const { id, square, width, orientation, x, y, captured } = props;
  const { inDanger = false, fallen = false } = props;
  const testID = captured ? `taken-piece-${square}` : `piece-${square}`;
  const { gesture, scale, zIndex, hidden } = usePieceGesture({
    ...props,
    color: id[0] as Color,
    testID,
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() },
      { translateY: y.get() },
      { scale: scale.get() },
    ] as const,
    zIndex: zIndex.get(),
    opacity: hidden.get() ? 0 : 1,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[styles.container, animatedStyle]}
        testID={testID}
        pointerEvents={captured ? 'none' : 'auto'}
      >
        <PieceImage
          id={id}
          width={width}
          orientation={orientation}
          inDanger={inDanger}
          fallen={fallen}
        />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
});

// Every prop compares correctly by reference - the shared values are stable
// for a piece's whole life, and Chessboard keeps its callbacks stable via
// useCallback - so this memoization skips re-rendering unrelated pieces:
// selecting one square shouldn't re-render all the others.
export default memo(Piece);
