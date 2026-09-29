import { useRef } from 'react';
import {
  StyleSheet,
  PanResponder,
  Animated,
  PanResponderGestureState,
} from 'react-native';
import { Square } from 'chess.js';

import { PIECES, TAP_MOVEMENT_THRESHOLD } from "../../../../constants";
import { Position } from "../../../../types";
import {
  getNewPositionFromGesture,
  getSquareFromXY,
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
  onSquarePress: (square: Square) => void;
  resetSelectedSquare: () => void;
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
  onSquarePress,
  resetSelectedSquare,
  showDragGuide,
  hideDragGuide,
  showValidMovesGuide,
  clearValidMovesGuide,
}) => {
  const square = getSquareFromXY(position, width);
  const scale = useRef(new Animated.Value(1)).current;
  const zIndex = useRef(new Animated.Value(0)).current;
  const panResponder = PanResponder.create({
    // Claim the responder on touch-down (not just on movement) so a plain
    // tap-and-release with no drag still reaches onPanResponderRelease.
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      if (disabled) return;
      showValidMovesGuide(position);
    },
    onPanResponderMove: (_, gestureState) => {
      // Opponent pieces are tap-only (see onPanResponderRelease) - they can't be dragged.
      if (disabled) return;
      // A little offset to move the piece image above the dragging finger for good visibility!
      const pieceImageOffsetFromActualGestureResponderPosition = width * 0.5;
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
      hideDragGuide();
      zoomOut();

      const isTap =
        Math.abs(gestureState.dx) < TAP_MOVEMENT_THRESHOLD &&
        Math.abs(gestureState.dy) < TAP_MOVEMENT_THRESHOLD;
      if (isTap) {
        // Tapping a piece - including an opponent's - selects its square
        // (as either a move's source or a capture's target).
        onSquarePress(square);
        return;
      }

      // A real drag - on any piece, own or not, legal target or not - moves the
      // piece directly via onMove below, bypassing onSquarePress entirely. It
      // must still invalidate whatever the tap-to-move flow had armed earlier,
      // or a stale selection can cause a later, unrelated tap to silently move
      // the wrong piece.
      resetSelectedSquare();
      if (disabled) return;

      const newPosition = getNewPositionFromGesture(position, gestureState, width);
      onMove(position, newPosition);
      // NOTE: DON'T CLEAR the valid moves guide if the piece landed on the same position.
      // I may also want to leave it on if the piece landed on an invalid square.
      if (!isSamePosition(position, newPosition)) {
        clearValidMovesGuide();
      }
    },
  });

  function zoomIn() {
    scale.setValue(1.4);
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
      testID={`piece-${square}`}
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

