import { memo } from 'react';
import { ImageSourcePropType, StyleSheet } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { Color, KingCheck, Square } from '../../../types';
import PieceImage from '../../PieceImage';

// Primitives and shared values, not the tracked piece itself: that's the same
// object as it moves, so wouldn't re-render this for its new square.
interface StaticPieceProps {
  square: Square;
  x: SharedValue<number>;
  y: SharedValue<number>;
  captured: boolean;
  source: ImageSourcePropType;
  width: number;
  orientation: Color;
  // This piece's king in danger, if it is one.
  danger: KingCheck | null;
  dangerColor: string;
}

// A piece on a view-only board: drawn where it's placed, with no gestures.
const StaticPiece: React.FC<StaticPieceProps> = ({
  square,
  x,
  y,
  captured,
  source,
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
    >
      <PieceImage
        source={source}
        width={width}
        orientation={orientation}
        inDanger={danger !== null}
        dangerColor={dangerColor}
        fallen={danger?.fallen ?? false}
        fadeDuration={0}
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
