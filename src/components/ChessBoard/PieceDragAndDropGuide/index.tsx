import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { DragGuide } from '../../../hooks/useDragGuide';

interface PieceDragAndDropGuideProps {
  boardWidth: number;
  squareWidth: number;
  guide: DragGuide;
}

const PieceDragAndDropGuide: React.FC<PieceDragAndDropGuideProps> = ({
  boardWidth,
  squareWidth,
  guide,
}) => {
  const dragGuideDiameter = squareWidth * 2.5;
  const offsetToCenter = -(dragGuideDiameter / 3.5);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: guide.opacity.get(),
    transform: [
      { translateX: guide.x.get() },
      { translateY: guide.y.get() },
    ] as const,
  }));
  return (
    <View
      style={{ position: 'absolute', width: boardWidth, height: boardWidth }}
      pointerEvents="none"
    >
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
});
