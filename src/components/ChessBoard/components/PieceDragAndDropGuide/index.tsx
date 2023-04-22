import { Animated } from "react-native";

interface PieceDragAndDropGuideProps {
  squareWidth: number;
  position: Animated.ValueXY;
  opacity: Animated.Value;
}

const PieceDragAndDropGuide: React.FC<PieceDragAndDropGuideProps> = ({
  squareWidth,
  position,
  opacity
}) => {
  const dragGuideDiameter = squareWidth * 2.5;
  const offsetToCenter = -(dragGuideDiameter / 3.5);
  return (
    <>
      <Animated.View style={{
        position: "absolute",
        zIndex: 10,
        height: dragGuideDiameter,
        width: dragGuideDiameter,
        borderRadius: dragGuideDiameter / 2,
        top: offsetToCenter,
        left: offsetToCenter,
        backgroundColor: 'rgba(70, 70, 70, 0.4)',
        opacity,
        transform: [
          { translateX: position.x },
          { translateY: position.y },
        ],

      }}>
      </Animated.View>
    </>
  );
}

export default PieceDragAndDropGuide;

