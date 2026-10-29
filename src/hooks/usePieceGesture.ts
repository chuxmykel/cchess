import { useRef } from 'react';
import { Animated, PanResponder, PanResponderGestureState } from 'react-native';
import { Color, Square } from 'chess.js';

import { Position } from '../domain/types';
import { getSquareFromXY } from '../domain/boardCoordinates';
import { getNewPositionFromGesture } from '../utils/animation';
import { TAP_MOVEMENT_THRESHOLD } from '../constants';
import {
  DRAG_SCALE,
  REST_THRESHOLDS,
  SCALE_SPRING,
} from '../constants/animations';

export type PieceGestureInput = {
  width: number;
  position: Position;
  orientation: Color;
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
  panHandlers: ReturnType<typeof PanResponder.create>['panHandlers'];
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
  // Everything below reads/writes `.current` synchronously during render:
  // `scale`/`zIndex` are lazy-inited once and never reassigned;
  // `latestPropsRef` is deliberately overwritten every render so the
  // PanResponder's handlers (created once, see below) always see fresh
  // props without needing to be recreated mid-gesture; `panResponderRef`
  // follows React's own documented lazy-ref-init pattern
  // (https://react.dev/reference/react/useRef#avoiding-recreating-the-ref-contents).
  // react-hooks/refs is a React-Compiler-readiness rule, not a
  // correctness bug under React's current (non-compiled) runtime -
  // revisit this if this project ever turns the compiler on.
  /* eslint-disable react-hooks/refs */
  const scale = useRef(new Animated.Value(1)).current;
  const zIndex = useRef(new Animated.Value(0)).current;
  // Whether this touch has turned into a drag and lifted the piece.
  const lifted = useRef(false);

  function springScaleTo(
    toValue: number,
    onDone?: (result: { finished: boolean }) => void,
  ) {
    Animated.spring(scale, {
      toValue,
      ...SCALE_SPRING,
      ...REST_THRESHOLDS,
      useNativeDriver: true,
    }).start(onDone);
  }

  // Once per drag, as it starts - not on every move event after.
  function lift() {
    if (lifted.current) return;
    lifted.current = true;
    zIndex.setValue(100);
    springScaleTo(DRAG_SCALE);
    latestPropsRef.current.showDragGuide();
  }

  // The piece shrinks back as it's set down, staying above the rest until
  // it has - by then a piece sent home has all but got there. A piece that
  // moved is drawn over the rest anyway (see usePieceAnimations).
  function setDown() {
    if (!lifted.current) return;
    lifted.current = false;
    springScaleTo(1, ({ finished }) => {
      // Lifted again before it was down.
      if (finished) zIndex.setValue(0);
    });
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
        lift();
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
          orientation,
          animatedPosition,
          square,
          onTap,
          onDragRelease,
        } = latestPropsRef.current;
        latestPropsRef.current.hideDragGuide();
        setDown();

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
        const newSquare = getSquareFromXY(newPosition, width, orientation);
        onDragRelease(square, newSquare);
      },
    });
  }

  return { panHandlers: panResponderRef.current.panHandlers, scale, zIndex };
  /* eslint-enable react-hooks/refs */
}
