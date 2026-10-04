import { useRef } from "react";
import { Animated, PanResponder, PanResponderGestureState } from "react-native";
import { Square } from "chess.js";

import { Position } from "../domain/types";
import { getSquareFromXY } from "../domain/boardCoordinates";
import { getNewPositionFromGesture } from "../utils/animation";
import { TAP_MOVEMENT_THRESHOLD } from "../constants";

export type PieceGestureInput = {
  width: number;
  position: Position;
  animatedPosition: Animated.ValueXY;
  disabled: boolean;
  onTap: (square: Square) => void;
  onDragRelease: (from: Square, to: Square) => void;
  onDragStart: (square: Square) => void;
  onDrag: (currentPosition: Position) => void;
  showDragGuide: () => void;
  hideDragGuide: () => void;
};

export type PieceGesture = {
  panHandlers: ReturnType<typeof PanResponder.create>["panHandlers"];
  scale: Animated.Value;
  zIndex: Animated.Value;
};

// Where the piece sprite should sit while being actively dragged: the
// finger's live position, offset upward by half the piece width so the
// dragged piece stays visible above the finger rather than hidden under it.
function getDraggedPosition(
  position: Position,
  gestureState: PanResponderGestureState,
  width: number,
): Position {
  const pieceImageOffsetFromActualGestureResponderPosition = width * 0.5;
  return {
    x: position.x + gestureState.dx,
    y:
      position.y +
      gestureState.dy -
      pieceImageOffsetFromActualGestureResponderPosition,
  };
}

// Interprets a piece's raw touch gesture - tap vs. drag, where it's being
// dragged to, and whether it was released on a real square - and reports
// the outcome through the given callbacks, while driving the zoom/scale
// feedback shown during a drag. Owns no game-rules knowledge: legality is
// entirely the caller's call via onTap/onDragRelease.
export function usePieceGesture(
  props: PieceGestureInput,
  square: Square,
): PieceGesture {
  const scale = useRef(new Animated.Value(1)).current;
  const zIndex = useRef(new Animated.Value(0)).current;

  function zoomIn() {
    scale.setValue(1.4);
    zIndex.setValue(100);
  }

  function zoomOut() {
    scale.setValue(1);
    zIndex.setValue(0);
  }

  // The PanResponder below is created exactly once (see the useRef it's
  // wrapped in) rather than directly in the render body, so a re-render
  // during an active touch can never reallocate it and invalidate the
  // gesture it's already resolving. Its handlers read every current value
  // through latestPropsRef instead of closing over props directly, so they
  // stay fresh across renders without the PanResponder itself needing to be
  // recreated.
  const latestPropsRef = useRef({ ...props, square });
  latestPropsRef.current = { ...props, square };

  const panResponderRef = useRef<ReturnType<typeof PanResponder.create> | null>(
    null,
  );
  if (!panResponderRef.current) {
    panResponderRef.current = PanResponder.create({
      // Claim the responder on touch-down (not just on movement) so a plain
      // tap-and-release with no drag still reaches onPanResponderRelease.
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const { disabled, position, square, onDrag, onDragStart } =
          latestPropsRef.current;
        if (disabled) return;

        onDrag(position);
        onDragStart(square);
      },
      onPanResponderMove: (_, gestureState) => {
        const { disabled, position, width, animatedPosition, onDrag } =
          latestPropsRef.current;
        // Opponent pieces get no drag affordance at all - they're tap-only (see release below).
        if (disabled) return;
        zoomIn();
        latestPropsRef.current.showDragGuide();
        animatedPosition.setValue(
          getDraggedPosition(position, gestureState, width),
        );
        const newPosition = getNewPositionFromGesture(
          position,
          gestureState,
          width,
        );
        onDrag(newPosition);
      },
      onPanResponderRelease: (_, gestureState: PanResponderGestureState) => {
        const {
          position,
          width,
          animatedPosition,
          square,
          onTap,
          onDragRelease,
        } = latestPropsRef.current;
        latestPropsRef.current.hideDragGuide();
        zoomOut();

        const isTap =
          Math.abs(gestureState.dx) < TAP_MOVEMENT_THRESHOLD &&
          Math.abs(gestureState.dy) < TAP_MOVEMENT_THRESHOLD;
        if (isTap) {
          animatedPosition.setValue(position);
          onTap(square);
          return;
        }

        const newPosition = getNewPositionFromGesture(
          position,
          gestureState,
          width,
        );
        const newSquare = getSquareFromXY(newPosition, width);
        onDragRelease(square, newSquare);
      },
    });
  }

  return { panHandlers: panResponderRef.current.panHandlers, scale, zIndex };
}
