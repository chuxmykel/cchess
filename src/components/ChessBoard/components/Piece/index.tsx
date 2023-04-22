import { useState } from 'react';
import {
  StyleSheet,
  PanResponder,
  Animated,
  PanResponderGestureState,
} from 'react-native';

import { PIECES } from "../../../../constants";
import { Position } from "../../../../types";


interface PieceProps {
  width: number;
  position: Position;
  animatedPosition: Animated.ValueXY;
  id: string;
  onMove: (from: Position, to: Position) => void;
  onDrag: (currentPosition: Position) => void;
  disabled: boolean;
  showDragGuide: () => void;
  hideDragGuide: () => void;
}

const Piece: React.FC<PieceProps> = ({
  width,
  position,
  animatedPosition,
  id,
  onMove,
  onDrag,
  disabled,
  showDragGuide,
  hideDragGuide,
}) => {
  const [scale] = useState(new Animated.Value(1));
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: () => { },
    onPanResponderMove: (_, gestureState) => {
      showDragGuide();
      const currentAnimatedPosition = {
        x: position.x + gestureState.dx,
        y: position.y + gestureState.dy,
      };
      animatedPosition.setValue(currentAnimatedPosition);
      const newPosition = getNewPositionFromGestureState(gestureState)
      onDrag(newPosition);
    },
    onPanResponderRelease: (_, gestureState: PanResponderGestureState) => {
      const newPosition = getNewPositionFromGestureState(gestureState)
      onMove(position, newPosition);
      hideDragGuide();
    },
  });

  function getNewPositionFromGestureState(gestureState: PanResponderGestureState) {
    const newX =
      Math.round((position.x + gestureState.dx) / width) * width;
    const newY =
      Math.round((position.y + gestureState.dy) / width) * width;
    const newPositon: Position = {
      x: newX,
      y: newY,
    };
    return newPositon;
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

