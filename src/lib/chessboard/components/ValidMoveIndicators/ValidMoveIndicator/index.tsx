import { Animated, StyleSheet } from 'react-native';

import { Point } from '../../../types';

interface ValidMoveIndicatorProps {
  position: Point;
  squareWidth: number;
  opacity: Animated.Value;
  color: string;
  testID?: string;
}

const ValidMoveIndicator: React.FC<ValidMoveIndicatorProps> = ({
  position,
  squareWidth,
  opacity,
  color,
  testID,
}) => {
  const indicatorDiameter = squareWidth / 3;
  const offsetToCenter = indicatorDiameter;
  return (
    <Animated.View
      pointerEvents="none"
      testID={testID}
      style={{
        ...styles.container,
        backgroundColor: color,
        borderRadius: indicatorDiameter / 2,
        top: offsetToCenter,
        left: offsetToCenter,
        height: indicatorDiameter,
        width: indicatorDiameter,
        opacity,
        transform: [{ translateX: position.x }, { translateY: position.y }],
      }}
    />
  );
};

export default ValidMoveIndicator;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
});
