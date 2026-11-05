import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { DragGuide } from '../../../hooks/useDragGuide';
import {
  MovableSquares,
  usePieceGesture,
} from '../../../hooks/usePieceGesture';
import { Color, Dests, PieceCode, Square } from '../../../types';
import { pieceLabel } from '../../../constants';
import PieceImage from '../../PieceImage';

interface PieceProps {
  id: PieceCode;
  svg: string;
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
  dangerColor?: string;
  fallen?: boolean;
  dests: SharedValue<Dests>;
  free?: boolean;
  movable: SharedValue<MovableSquares>;
  dragGuide: DragGuide;
  onTap: (square: Square) => void;
  onDragRelease: (from: Square, to: Square | null, isMove: boolean) => void;
  onDragStart: (square: Square) => void;
  onDragLog?: (line: string) => void;
}

const Piece: React.FC<PieceProps> = (props) => {
  const { id, svg, square, width, orientation, x, y, captured } = props;
  const { inDanger = false, dangerColor, fallen = false } = props;
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
        accessibilityLabel={pieceLabel(id)}
        pointerEvents={captured ? 'none' : 'auto'}
      >
        <PieceImage
          svg={svg}
          width={width}
          orientation={orientation}
          inDanger={inDanger}
          dangerColor={dangerColor}
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
