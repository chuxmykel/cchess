import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';
import { KING_FALL_DEGREES, KING_FALL_TIMING } from '../../constants';
import { Color } from '../../types';

interface PieceImageProps {
  // The piece's SVG, from its set.
  svg: string;
  width: number;
  orientation: Color;
  // A king in check, or whose side lost, glowing red.
  inDanger?: boolean;
  // Its glow's color.
  dangerColor?: string;
  // A king whose side lost - mated, or any other way - tipped over.
  fallen?: boolean;
}

// How far a king in check's glow spreads, as a share of the square.
const GLOW_RADIUS_RATIO = 0.15;

// A piece's image, as both boards draw it: stood upright on a board turned
// round for black, and for a king in danger, glowing red - toppling over
// once its side has lost.
const PieceImage: React.FC<PieceImageProps> = ({
  svg,
  width,
  orientation,
  inDanger = false,
  dangerColor,
  fallen = false,
}) => {
  const fall = useSharedValue(fallen ? 1 : 0);
  useEffect(() => {
    fall.set(withTiming(fallen ? 1 : 0, KING_FALL_TIMING));
  }, [fall, fallen]);
  const fallStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fall.get() * KING_FALL_DEGREES}deg` }],
  }));

  const size = { width, height: width };
  return (
    <View style={[size, orientation === 'b' && styles.upright]}>
      <Animated.View style={[size, fallStyle]} testID="sprite">
        {/* With no background of its own, the view's shadow follows the
            piece's shape - a glow around the king, not a box. */}
        <View
          style={[
            size,
            inDanger && [
              styles.glow,
              {
                shadowColor: dangerColor,
                shadowRadius: width * GLOW_RADIUS_RATIO,
              },
            ],
          ]}
          testID={inDanger ? 'danger-glow' : undefined}
        >
          <Drawing svg={svg} width={width} />
        </View>
      </Animated.View>
    </View>
  );
};

// The SVG itself, drawn again only for a new piece or size - not as the
// board turns round, which every piece's upright turn follows.
const Drawing = memo(function Drawing({
  svg,
  width,
}: {
  svg: string;
  width: number;
}) {
  return <SvgXml xml={svg} width={width} height={width} testID="drawing" />;
});

export default PieceImage;

const styles = StyleSheet.create({
  upright: {
    transform: [{ rotate: '180deg' }],
  },
  glow: {
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 0 },
  },
});
