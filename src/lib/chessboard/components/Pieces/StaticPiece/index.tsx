import { memo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { pieceLabel } from '../../../constants';
import { Color, KingCheck, PieceCode, Square } from '../../../types';
import PieceImage from '../../PieceImage';

// Primitives and shared values, not the tracked piece itself: that's the same
// object as it moves, so wouldn't re-render this for its new square.
interface StaticPieceProps {
  id: PieceCode;
  square: Square;
  x: SharedValue<number>;
  y: SharedValue<number>;
  captured: boolean;
  svg: string;
  width: number;
  orientation: Color;
  // This piece's king in danger, if it is one.
  danger: KingCheck | null;
  dangerColor: string;
}

// A piece on a view-only board: drawn where it's placed, with no gestures.
const StaticPiece: React.FC<StaticPieceProps> = ({
  id,
  square,
  x,
  y,
  captured,
  svg,
  width,
  orientation,
  danger,
  dangerColor,
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { translateY: y.get() }] as const,
  }));
  return (
    <Animated.View
      style={[styles.piece, animatedStyle]}
      testID={captured ? `taken-piece-${square}` : `piece-${square}`}
      accessibilityLabel={pieceLabel(id)}
    >
      <PieceImage
        svg={svg}
        width={width}
        orientation={orientation}
        inDanger={danger !== null}
        dangerColor={dangerColor}
        fallen={danger?.fallen ?? false}
      />
    </Animated.View>
  );
};

export default memo(StaticPiece);

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
  },
});
