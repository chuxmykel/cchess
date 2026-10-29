import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import {
  ComposedGesture,
  PanGestureConfig,
  TapGestureConfig,
  useExclusiveGestures,
  usePanGesture,
  useTapGesture,
} from 'react-native-gesture-handler';
import {
  SharedValue,
  useSharedValue,
  withTiming,
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
  MOVE_TIMING,
  SCALE_TIMING,
  SNAP_BACK_TIMING,
} from '../constants/animations';
import { DragGuide } from './useDragGuide';

export type PieceGestureInput = {
  square: Square;
  width: number;
  orientation: Color;
  // The piece's position from white's side, which a drag moves (see
  // usePieceAnimations).
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

// The last square's corner, from either side - a board is 8 squares across.
const LAST_SQUARE = 7;

// A point on screen as seen from white's side - and back, the same way:
// turning the board round for black mirrors both axes. The pieces' positions
// are kept from white's side; touches, the squares and the guide are on screen.
function toWhiteSide(
  screen: { x: number; y: number },
  width: number,
  orientation: Color,
) {
  'worklet';
  if (orientation === 'w') return screen;
  return {
    x: LAST_SQUARE * width - screen.x,
    y: LAST_SQUARE * width - screen.y,
  };
}

// How far the finger has moved since it touched down, on screen. Not the
// pan's translation: on iOS, Gesture Handler counts that from where the drag
// activates - once the finger has moved TAP_MOVEMENT_THRESHOLD points - so a
// piece moved by it would trail the finger by that much, and be dropped that
// much short of it, often on the square before.
function movedSinceTouchDown(
  touchDown: { x: number; y: number },
  event: { absoluteX: number; absoluteY: number },
) {
  'worklet';
  return { x: event.absoluteX - touchDown.x, y: event.absoluteY - touchDown.y };
}

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
// under it, and on release the piece goes straight to the square it was
// dropped on when that's a legal move (or home when it isn't), before JS has
// heard about the drop at all. JS gets the outcome through the callbacks and
// stays the judge of the move - a drop it refuses is sent home from there.
export function usePieceGesture(props: PieceGestureInput): PieceGesture {
  const { x, y, legalTargets, dragGuide, captured = false, testID } = props;
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  // Where the finger went down, on screen.
  const touchDown = useSharedValue({ x: 0, y: 0 });
  // How far it had moved when the piece was last drawn - where it's dropped.
  // Not where the finger lifts: in a quick flick it's still travelling as it
  // leaves the glass, so the lift lands past the square the piece and the
  // guide were showing - often on one it can't go to, sending it home.
  const lastMoved = useSharedValue({ x: 0, y: 0 });

  const piece = useSharedValue<PieceState>({
    square: props.square,
    width: props.width,
    orientation: props.orientation,
    disabled: props.disabled,
  });
  const { square, width, orientation, disabled } = props;
  useLayoutEffect(() => {
    piece.set({ square, width, orientation, disabled });
    // A piece dropped on a move stays above the rest until the game has made
    // the move (see onDeactivate) - from then it's drawn over them anyway, as
    // the piece just moved. Lowered too if it's taken, or play stops.
    zIndex.set(0);
  }, [piece, zIndex, square, width, orientation, disabled, captured]);

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

  // Each gesture's config is made once (bar a change of testID, or the piece
  // being taken): Gesture Handler rebuilds a gesture - its native config and
  // its worklets - whenever it's handed a new one, and a piece re-renders on
  // every move. Everything the callbacks read that changes is a shared value,
  // or reached through `report`.
  const panConfig = useMemo<PanGestureConfig>(
    () => ({
      testID: testID && `${testID}-pan`,
      enabled: !captured,
      minDistance: TAP_MOVEMENT_THRESHOLD,
      onBegin: (event) => {
        'worklet';
        touchDown.set({ x: event.absoluteX, y: event.absoluteY });
        lastMoved.set({ x: 0, y: 0 });
        const { square, width, orientation, disabled } = piece.get();
        if (disabled) return;
        // The guide marks the piece's own square from touch-down.
        const home = getXYFromSquare(square, width, orientation);
        dragGuide.x.set(home.x);
        dragGuide.y.set(home.y);
        dragGuide.opacity.set(1);
        scheduleOnRN(report, 'onDragStart', square);
      },
      onActivate: (event) => {
        'worklet';
        // Where the drop goes even if no update follows before the release.
        lastMoved.set(movedSinceTouchDown(touchDown.get(), event));
        if (piece.get().disabled) return;
        zIndex.set(DRAGGED_Z_INDEX);
        scale.set(withTiming(DRAG_SCALE, SCALE_TIMING));
      },
      onUpdate: (event) => {
        'worklet';
        const { square, width, orientation, disabled } = piece.get();
        const moved = movedSinceTouchDown(touchDown.get(), event);
        lastMoved.set(moved);
        // Opponent pieces get no drag affordance at all - they're tap-only.
        if (disabled) return;
        const home = getXYFromSquare(square, width, orientation);
        const dragged = { x: home.x + moved.x, y: home.y + moved.y };
        // Drawn half a square above the finger, so it isn't hidden under it.
        const drawn = toWhiteSide(
          { x: dragged.x, y: dragged.y - width * 0.5 },
          width,
          orientation,
        );
        x.set(drawn.x);
        y.set(drawn.y);
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
        const moved = lastMoved.get();
        const centre = {
          x: home.x + moved.x + width / 2,
          y: home.y + moved.y + width / 2,
        };
        const to = getSquareFromXY(centre, width, orientation);
        const isMove =
          !event.canceled &&
          isOnBoard(centre, width) &&
          (legalTargets.get()[square] ?? []).includes(to);

        if (!disabled) {
          // Set down: it shrinks back, and stays above the rest - on a move,
          // until JS has made it, which can be a while after the piece has
          // landed (see the layout effect above): lowered sooner, the piece
          // it takes - drawn later, if it was the last to move - would show
          // on top of it in the meantime. Sent home, until it's there.
          scale.set(withTiming(1, SCALE_TIMING));
          const target = getXYFromSquare(isMove ? to : square, width);
          const timing = isMove ? MOVE_TIMING : SNAP_BACK_TIMING;
          const lowerOnceHome = isMove
            ? undefined
            : (finished?: boolean) => {
                'worklet';
                // Not if it was picked up again before it was home.
                if (finished) zIndex.set(0);
              };
          x.set(withTiming(target.x, timing, lowerOnceHome));
          y.set(withTiming(target.y, timing, lowerOnceHome));
        }
        if (!event.canceled) scheduleOnRN(report, 'onDragRelease', square, to);
      },
      onFinalize: () => {
        'worklet';
        // A touch that ended as a tap never moved the guide off the piece.
        dragGuide.opacity.set(0);
      },
    }),
    [
      testID,
      captured,
      piece,
      touchDown,
      lastMoved,
      dragGuide,
      x,
      y,
      scale,
      zIndex,
      legalTargets,
      report,
    ],
  );
  const pan = usePanGesture(panConfig);

  const tapConfig = useMemo<TapGestureConfig>(
    () => ({
      testID: testID && `${testID}-tap`,
      enabled: !captured,
      onActivate: () => {
        'worklet';
        scheduleOnRN(report, 'onTap', piece.get().square);
      },
    }),
    [testID, captured, piece, report],
  );
  const tap = useTapGesture(tapConfig);

  // A drag wins; a touch that never moves far enough to be one is a tap.
  const gesture = useExclusiveGestures(pan, tap);

  return { gesture, scale, zIndex };
}
