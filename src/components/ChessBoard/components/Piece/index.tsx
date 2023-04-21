import { useState } from 'react';
import {
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
  onMove: (from: Position, to: Position) => void;
  disabled: boolean;
}

const Piece: React.FC<PieceProps> = ({
  width,
  position,
  animatedPosition,
  id,
  onMove,
  disabled,
}) => {
  const [scale] = useState(new Animated.Value(1));
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: () => { },
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
      onMove(position, newPositon);
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
      <Animated.Image
        source={PIECES[id]}
        style={{
          width: width,
          height: width,
          transform: [{ scale: scale }],
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

