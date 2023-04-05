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
  const [scale] = useState(new Animated.Value(1));
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: () => {
      zoomIn();
    },
    onPanResponderMove: (_, gesture) => {
      // TODO: Can I use setValue to change the animatedPosition instead of creating
      // a new one after each move. (Causing the game to stutter)???
      animatedPosition.setValue({
        x: position.x + gesture.dx,
        y: position.y + gesture.dy,
        // FIXME: I want the piece to be offset
        // from the gesture generating finger so it's clear
        // what piece is being dragged.
        // This will mean I should give some visual feedback as
        // to the square where the piece will land.
        // I'll leave this commented out until I'm ready to implement this feature.
        // y: (position.y + gesture.dy) - (1.2 * width),
      });
      // animatedPosition.setOffset({
      //
      //   x: position.x + gesture.dx,
      //   y: position.y + gesture.dy,
      // });
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
      zoomOut();
    },
  });

  function zoomIn() {
    Animated.timing(scale, {
      toValue: 2,
      duration: 0,
      useNativeDriver: true,
    }).start();
  }
  function zoomOut() {
    Animated.timing(scale, {
      toValue: 1,
      duration: 0,
      useNativeDriver: true,
    }).start();
  }

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

