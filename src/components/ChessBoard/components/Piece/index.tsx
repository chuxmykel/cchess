import {
  Image,
  StyleSheet,
  PanResponder,
  Animated,
} from 'react-native';

import { PIECES } from "../../../../constants";
import { Position } from "../../../../types";


interface PieceProps {
  width: number;
  position: Position;
  animatedPosition: Animated.ValueXY;
  id: string;
  move: (from: Position, to: Position) => void;
  disabled: boolean;
}

const Piece: React.FC<PieceProps> = ({
  width,
  position,
  animatedPosition,
  id,
  move,
  disabled,
}) => {
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderMove: (_, gesture) => {
      animatedPosition.setValue({
        x: position.x + gesture.dx,
        y: position.y + gesture.dy,
      });
    },
    onPanResponderRelease: (_, gesture) => {
      const newX =
        Math.round((position.x + gesture.dx) / width) * width;
      const newY =
        Math.round((position.y + gesture.dy) / width) * width;
      const newPositon: Position = {
        x: newX,
        y: newY,
      };
      move(position, newPositon);
    },
  });

  return (
    <Animated.View
      style={{
        ...styles.container,
        transform: [
          { translateX: animatedPosition.x },
          { translateY: animatedPosition.y },
        ],
      }}
      {...panResponder.panHandlers}
    >
      <Image
        source={PIECES[id]}
        style={{
          width: width,
          height: width,
        }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
});

export default Piece;

