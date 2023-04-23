import { Animated, StyleSheet } from "react-native";
import { Position } from "../../../../types";

interface ValidMoveIndicatorProps {
  position: Position;
  squareWidth: number;
  opacity: Animated.Value;
};

const ValidMoveIndicator: React.FC<
  ValidMoveIndicatorProps
> = ({
  position,
  squareWidth,
  opacity,
}) => {
    const indicatorDiameter = squareWidth / 3;
    const offsetToCenter = indicatorDiameter;
    return (
      <Animated.View
        style={{
          ...styles.container,
          borderRadius: indicatorDiameter / 2,
          top: offsetToCenter,
          left: offsetToCenter,
          height: indicatorDiameter,
          width: indicatorDiameter,
          opacity,
          transform: [
            { translateX: position.x },
            { translateY: position.y },
          ],
        }}
      />
    );
  }

export default ValidMoveIndicator;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    backgroundColor: 'rgba(70, 70, 70, 0.4)',
  }
});

