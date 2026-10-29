import { useCallback, useLayoutEffect, useRef } from 'react';
import {
  ComposedGesture,
  useExclusiveGestures,
  usePanGesture,
  useTapGesture,
} from 'react-native-gesture-handler';
import {
  SharedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Color, Square } from 'chess.js';

import {
  getSquareFromXY,
  getXYFromSquare,
  isOnBoard,
} from '../domain/boardCoordinates';
import { LegalTargets } from '../domain/types';
import { TAP_MOVEMENT_THRESHOLD } from '../constants';
import {
  DRAG_SCALE,
  DRAGGED_Z_INDEX,
  MOVE_SPRING,
  SCALE_SPRING,
  SNAP_BACK_SPRING,
} from '../constants/animations';
import { DragGuide } from './useDragGuide';

export type PieceGestureInput = {
  square: Square;
  width: number;
  orientation: Color;
  // The piece's on-screen position, which a drag moves.
  x: SharedValue<number>;
  y: SharedValue<number>;
  // Can't be picked up - an opponent's piece, or any piece once the game is
  // over. A tap still reports, so it can be a move's target.
  disabled: boolean;
  // A piece just taken: no gestures at all.
  captured?: boolean;
  legalTargets: SharedValue<LegalTargets>;
  dragGuide: DragGuide;
  onTap: (square: Square) => void;
  onDragStart: (square: Square) => void;
  onDragRelease: (from: Square, to: Square) => void;
  testID?: string;
};

export type PieceGesture = {
  gesture: ComposedGesture;
  scale: SharedValue<number>;
  zIndex: SharedValue<number>;
};

type Report = 'onTap' | 'onDragStart' | 'onDragRelease';

// What the gesture needs to know about the piece as it stands, read on the
// UI thread when the touch happens rather than captured when it was set up.
type PieceState = {
  square: Square;
  width: number;
  orientation: Color;
  disabled: boolean;
};

// Interprets a piece's touches - tap vs. drag, where it's dragged to - on the
// UI thread: the piece follows the finger, the drag guide marks the square
// under it, and on release the piece springs straight to the square it was
// dropped on when that's a legal move (or home when it isn't), before JS has
// heard about the drop at all. JS gets the outcome through the callbacks and
// stays the judge of the move - a drop it refuses is sent home from there.
export function usePieceGesture(props: PieceGestureInput): PieceGesture {
  const { x, y, legalTargets, dragGuide, captured = false, testID } = props;
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);

  const piece = useSharedValue<PieceState>({
    square: props.square,
    width: props.width,
    orientation: props.orientation,
    disabled: props.disabled,
  });
  const { square, width, orientation, disabled } = props;
  useLayoutEffect(() => {
    piece.set({ square, width, orientation, disabled });
  }, [piece, square, width, orientation, disabled]);

  // The callbacks as they are now, for the gesture to call from the UI thread
  // through one function that never changes.
  const latestProps = useRef(props);
  useLayoutEffect(() => {
    latestProps.current = props;
  });
  const report = useCallback((event: Report, from: Square, to?: Square) => {
    const callbacks = latestProps.current;
    if (event === 'onDragRelease') callbacks.onDragRelease(from, to);
    else callbacks[event](from);
  }, []);

  const pan = usePanGesture({
    testID: testID && `${testID}-pan`,
    enabled: !captured,
    minDistance: TAP_MOVEMENT_THRESHOLD,
    onBegin: () => {
      'worklet';
      const { square, width, orientation, disabled } = piece.get();
      if (disabled) return;
      // The guide marks the piece's own square from touch-down.
      const home = getXYFromSquare(square, width, orientation);
      dragGuide.x.set(home.x);
      dragGuide.y.set(home.y);
      dragGuide.opacity.set(1);
      scheduleOnRN(report, 'onDragStart', square);
    },
    onActivate: () => {
      'worklet';
      if (piece.get().disabled) return;
      zIndex.set(DRAGGED_Z_INDEX);
      scale.set(withSpring(DRAG_SCALE, SCALE_SPRING));
    },
    onUpdate: (event) => {
      'worklet';
      const { square, width, orientation, disabled } = piece.get();
      // Opponent pieces get no drag affordance at all - they're tap-only.
      if (disabled) return;
      const home = getXYFromSquare(square, width, orientation);
      const dragged = {
        x: home.x + event.translationX,
        y: home.y + event.translationY,
      };
      // Drawn half a square above the finger, so it isn't hidden under it.
      x.set(dragged.x);
      y.set(dragged.y - width * 0.5);
      const centre = { x: dragged.x + width / 2, y: dragged.y + width / 2 };
      if (isOnBoard(centre, width)) {
        dragGuide.x.set(Math.floor(centre.x / width) * width);
        dragGuide.y.set(Math.floor(centre.y / width) * width);
        dragGuide.opacity.set(1);
      } else {
        dragGuide.opacity.set(0);
      }
    },
    onDeactivate: (event) => {
      'worklet';
      const { square, width, orientation, disabled } = piece.get();
      dragGuide.opacity.set(0);
      const home = getXYFromSquare(square, width, orientation);
      const centre = {
        x: home.x + event.translationX + width / 2,
        y: home.y + event.translationY + width / 2,
      };
      const to = getSquareFromXY(centre, width, orientation);
      const isMove =
        !event.canceled &&
        isOnBoard(centre, width) &&
        (legalTargets.get()[square] ?? []).includes(to);

      if (!disabled) {
        // Set down: it shrinks back, staying above the rest until it has.
        scale.set(
          withSpring(1, SCALE_SPRING, (finished) => {
            'worklet';
            // Not if it was lifted again before it was down.
            if (finished) zIndex.set(0);
          }),
        );
        const target = isMove ? getXYFromSquare(to, width, orientation) : home;
        const spring = isMove ? MOVE_SPRING : SNAP_BACK_SPRING;
        x.set(withSpring(target.x, spring));
        y.set(withSpring(target.y, spring));
      }
      if (!event.canceled) scheduleOnRN(report, 'onDragRelease', square, to);
    },
    onFinalize: () => {
      'worklet';
      // A touch that ended as a tap never moved the guide off the piece.
      dragGuide.opacity.set(0);
    },
  });

  const tap = useTapGesture({
    testID: testID && `${testID}-tap`,
    enabled: !captured,
    onActivate: () => {
      'worklet';
      scheduleOnRN(report, 'onTap', piece.get().square);
    },
  });

  // A drag wins; a touch that never moves far enough to be one is a tap.
  const gesture = useExclusiveGestures(pan, tap);

  return { gesture, scale, zIndex };
}
