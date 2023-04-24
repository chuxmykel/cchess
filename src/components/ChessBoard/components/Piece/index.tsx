import { useRef } from 'react';
import {
  StyleSheet,
  PanResponder,
  Animated,
  PanResponderGestureState,
} from 'react-native';

import { PIECES } from "../../../../constants";
import { Position } from "../../../../types";
import {
  getNewPositionFromGesture,
  isSamePosition,
} from '../../../../utils';


interface PieceProps {
  width: number;
  position: Position;
  animatedPosition: Animated.ValueXY;
  id: string;
  disabled: boolean;
  opacity: Animated.Value;
  onMove: (from: Position, to: Position) => void;
  onDrag: (currentPosition: Position) => void;
  showDragGuide: () => void;
  hideDragGuide: () => void;
  showValidMovesGuide: (fromPosition: Position) => void;
  clearValidMovesGuide: () => void;
}

const Piece: React.FC<PieceProps> = ({
  width,
  position,
  animatedPosition,
  id,
  disabled,
  opacity,
  onMove,
  onDrag,
  showDragGuide,
  hideDragGuide,
  showValidMovesGuide,
  clearValidMovesGuide,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const zIndex = useRef(new Animated.Value(0)).current;
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: () => {
      showValidMovesGuide(position);
    },
    onPanResponderMove: (_, gestureState) => {
      // A little offset to move the piece image above the dragging finger for good visibility!
      const pieceImageOffsetFromActualGestureResponderPosition = width * 1.5;
      zoomIn();
      showDragGuide();
      const currentAnimatedPosition = {
        x: position.x + gestureState.dx,
        y: position.y + gestureState.dy - pieceImageOffsetFromActualGestureResponderPosition,
      };
      animatedPosition.setValue(currentAnimatedPosition);
      const newPosition = getNewPositionFromGesture(
        position,
        gestureState,
        width
      );
      onDrag(newPosition);
    },
    onPanResponderRelease: (_, gestureState: PanResponderGestureState) => {
      const newPosition = getNewPositionFromGesture(position, gestureState, width);
      onMove(position, newPosition);
      // NOTE: DON'T CLEAR the valid moves guide if the piece landed on the same position.
      // I may also want to leave it on if the piece landed on an invalid square.
      if (!isSamePosition(position, newPosition)) {
        clearValidMovesGuide();
      }
      hideDragGuide();
      zoomOut();
    },
  });

  function zoomIn() {
    scale.setValue(2.5);
    zIndex.setValue(100);
  }

  function zoomOut() {
    scale.setValue(1);
    zIndex.setValue(0);
  }
  return (
    <Animated.View
      style={{
        ...styles.container,
        transform: [
          { translateX: animatedPosition.x },
          { translateY: animatedPosition.y },
        ],
        zIndex,
        opacity,
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

