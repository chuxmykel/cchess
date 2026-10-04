import { memo, useRef } from "react";
import {
  StyleSheet,
  PanResponder,
  Animated,
  PanResponderGestureState,
} from "react-native";
import { Square } from "chess.js";

import { PIECES, TAP_MOVEMENT_THRESHOLD } from "../../../../constants";
import { Position } from "../../../../domain/types";
import { getSquareFromXY } from "../../../../domain/boardCoordinates";
import { getNewPositionFromGesture } from "../../../../utils/animation";

interface PieceProps {
  width: number;
  position: Position;
  animatedPosition: Animated.ValueXY;
  id: string;
  disabled: boolean;
  opacity: Animated.Value;
  onTap: (square: Square) => void;
  onDragRelease: (from: Square, to: Square) => void;
  onDragStart: (square: Square) => void;
  onDrag: (currentPosition: Position) => void;
  showDragGuide: () => void;
  hideDragGuide: () => void;
}

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

const Piece: React.FC<PieceProps> = (props) => {
  const { width, position, animatedPosition, id, opacity } = props;
  const square = getSquareFromXY(position, width);
  const scale = useRef(new Animated.Value(1)).current;
  const zIndex = useRef(new Animated.Value(0)).current;

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
  const panResponder = panResponderRef.current;

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
          { scale: scale },
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
        }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
  },
});

// `position` is a plain `{x, y}` object rebuilt fresh on every Chessboard
// render (even when its values haven't changed), so the default shallow
// comparator would never consider two renders equal - compare its fields by
// value instead. Everything else compares correctly by reference, including
// the callback props, which Chessboard keeps stable via useCallback so this
// memoization skips re-rendering unrelated pieces: selecting one square
// shouldn't re-render all the others.
function arePropsEqual(prev: PieceProps, next: PieceProps): boolean {
  return (
    prev.id === next.id &&
    prev.disabled === next.disabled &&
    prev.width === next.width &&
    prev.position.x === next.position.x &&
    prev.position.y === next.position.y &&
    prev.animatedPosition === next.animatedPosition &&
    prev.opacity === next.opacity &&
    prev.onTap === next.onTap &&
    prev.onDragRelease === next.onDragRelease &&
    prev.onDragStart === next.onDragStart &&
    prev.onDrag === next.onDrag &&
    prev.showDragGuide === next.showDragGuide &&
    prev.hideDragGuide === next.hideDragGuide
  );
}

export default memo(Piece, arePropsEqual);
