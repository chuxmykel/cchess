import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { DragGuide } from '../../../hooks/useDragGuide';

interface PieceDragAndDropGuideProps {
  boardWidth: number;
  squareWidth: number;
  guide: DragGuide;
}

// How wide the guide's circle is, in squares - as on lichess.
const GUIDE_SQUARES = 2;

// What a drag shows on the board, as on lichess: the square the piece came
// from, marked while it's held, and a circle centred on the square a drop
// would land on.
const PieceDragAndDropGuide: React.FC<PieceDragAndDropGuideProps> = ({
  boardWidth,
  squareWidth,
  guide,
}) => {
  const dragGuideDiameter = squareWidth * GUIDE_SQUARES;
  const offsetToCenter = -(dragGuideDiameter - squareWidth) / 2;
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: guide.opacity.get(),
    transform: [
      { translateX: guide.x.get() },
      { translateY: guide.y.get() },
    ] as const,
  }));
  const originStyle = useAnimatedStyle(() => {
    const origin = guide.origin.get();
    return {
      opacity: origin ? 1 : 0,
      transform: [
        { translateX: origin?.x ?? 0 },
        { translateY: origin?.y ?? 0 },
      ] as const,
    };
  });
  return (
    <View
      style={{ position: 'absolute', width: boardWidth, height: boardWidth }}
      pointerEvents="none"
    >
      <Animated.View
        testID="drag-origin"
        style={[
          styles.origin,
          { width: squareWidth, height: squareWidth },
          originStyle,
        ]}
      />
      <Animated.View
        testID="drag-guide"
        style={[
          styles.container,
          {
            height: dragGuideDiameter,
            width: dragGuideDiameter,
            borderRadius: dragGuideDiameter / 2,
            top: offsetToCenter,
            left: offsetToCenter,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

export default PieceDragAndDropGuide;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'rgba(70, 70, 70, 0.4)',
  },
  origin: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(255, 210, 60, 0.5)',
  },
});
