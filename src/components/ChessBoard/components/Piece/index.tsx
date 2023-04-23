import { useRef } from 'react';
import {
  StyleSheet,
  PanResponder,
  Animated,
  PanResponderGestureState,
} from 'react-native';

import { PIECES } from "../../../../constants";
import { Position } from "../../../../types";
import { getNewPositionFromGesture } from '../../../../utils';


interface PieceProps {
  width: number;
  position: Position;
  animatedPosition: Animated.ValueXY;
  id: string;
  disabled: boolean;
  opacity: Animated.Value;
  onMove: (from: Position, to: Position) => void;
  onDrag: (currentPosition: Position) => void;
  onPress: (position: Position) => void;
  showDragGuide: () => void;
  hideDragGuide: () => void;
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
  onPress,
  showDragGuide,
  hideDragGuide,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const zIndex = useRef(new Animated.Value(0)).current;
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => !disabled,
    onStartShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: () => {
      onPress(position);
    },
    onPanResponderMove: (_, gestureState) => {
      zoomIn();
      showDragGuide();
      const currentAnimatedPosition = {
        x: position.x + gestureState.dx,
        // A little offset on the y-axis to the top to make piece visible when dragging.
        y: position.y + gestureState.dy - width * 1.5,
      };
      animatedPosition.setValue(currentAnimatedPosition);
      const newPosition = getNewPositionFromGesture(position, gestureState, width);
      onDrag(newPosition);
    },
    onPanResponderRelease: (_, gestureState: PanResponderGestureState) => {
      const newPosition = getNewPositionFromGesture(position, gestureState, width);
      onMove(position, newPosition);
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

