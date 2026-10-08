import { View, Animated, StyleSheet } from 'react-native';

interface PieceDragAndDropGuideProps {
  boardWidth: number;
  squareWidth: number;
  position: Animated.ValueXY;
  opacity: Animated.Value;
}

const PieceDragAndDropGuide: React.FC<PieceDragAndDropGuideProps> = ({
  boardWidth,
  squareWidth,
  position,
  opacity,
}) => {
  const dragGuideDiameter = squareWidth * 2.5;
  const offsetToCenter = -(dragGuideDiameter / 3.5);
  return (
    <View
      style={{ position: 'absolute', width: boardWidth, height: boardWidth }}
      pointerEvents="none"
    >
      <Animated.View
        testID="drag-guide"
        style={{
          ...styles.container,
          height: dragGuideDiameter,
          width: dragGuideDiameter,
          borderRadius: dragGuideDiameter / 2,
          top: offsetToCenter,
          left: offsetToCenter,
          opacity,
          transform: [{ translateX: position.x }, { translateY: position.y }],
        }}
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
