import { memo, useEffect } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
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
        <View
          style={[size, inDanger && glowStyle(dangerColor, width)]}
          testID={inDanger ? 'danger-glow' : undefined}
        >
          <Drawing svg={svg} width={width} />
        </View>
      </Animated.View>
    </View>
  );
};

// A king in danger's glow, following the piece's shape - a glow around the
// king, not a box. On iOS it's the view's shadow, which with no background
// of its own takes the shape of what's drawn in it; Android draws no such
// shadow, but a drop-shadow filter (Android's alone) does the same.
function glowStyle(color: string | undefined, width: number): ViewStyle {
  const radius = width * GLOW_RADIUS_RATIO;
  if (Platform.OS === 'android') {
    return {
      filter: [
        {
          dropShadow: {
            offsetX: 0,
            offsetY: 0,
            standardDeviation: radius,
            color,
          },
        },
      ],
    };
  }
  return {
    shadowColor: color,
    shadowRadius: radius,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 0 },
  };
}

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
});
