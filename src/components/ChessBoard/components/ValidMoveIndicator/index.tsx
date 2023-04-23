import { View } from "react-native";
import { Position } from "../../../../types";

interface ValidMoveIndicatorProps {
  position: Position;
  squareWidth: number;
};

const ValidMoveIndicator: React.FC<ValidMoveIndicatorProps> = ({ position, squareWidth }) => {
  const indicatorDiameter = squareWidth / 3;
  const offsetToCenter = indicatorDiameter;
  return (
    <View
      style={{
        position: "absolute",
        backgroundColor: 'rgba(70, 70, 70, 0.4)',
        borderRadius: indicatorDiameter / 2,
        top: offsetToCenter,
        left: offsetToCenter,
        height: indicatorDiameter,
        width: indicatorDiameter,
        transform: [
          { translateX: position.x },
          { translateY: position.y },
        ],
      }}
    />
  );
}

export default ValidMoveIndicator;

