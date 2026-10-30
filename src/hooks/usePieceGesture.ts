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
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Color, Square } from 'chess.js';

import {
  getSquareFromXY,
  getXYFromSquare,
  isOnBoard,
} from '../domain/boardCoordinates';
import { otherColor } from '../domain/players';
import { LegalTargets } from '../domain/types';
import { TAP_MOVEMENT_THRESHOLD } from '../constants';
import {
  DRAG_LIFT,
  DROP_LIFT_GRACE_MS,
  DRAG_SCALE,
  DRAGGED_Z_INDEX,
} from '../constants/animations';
import { DRAG_LOG_ENABLED, logDrag } from '../utils/dragLog';
import { DragGuide } from './useDragGuide';

export type PieceGestureInput = {
  square: Square;
  color: Color;
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
  // Taken by a drop that JS hasn't made yet (see DragGuide's `taken`).
  hidden: SharedValue<boolean>;
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

// Where on the piece the finger went down, on screen, from its top-left
// corner. The event's point is in the piece's own view, which is turned round
// with the pieces layer on a board seen from black's side.
function grabPoint(
  event: { x: number; y: number },
  width: number,
  orientation: Color,
) {
  'worklet';
  if (orientation === 'w') return { x: event.x, y: event.y };
  return { x: width - event.x, y: width - event.y };
}

// Where the finger is on the board, on screen: where it grabbed the piece on
// its square, and how far it has moved since.
function fingerOnBoard(
  square: Square,
  width: number,
  orientation: Color,
  grab: { x: number; y: number },
  moved: { x: number; y: number },
) {
  'worklet';
  const home = getXYFromSquare(square, width, orientation);
  return { x: home.x + grab.x + moved.x, y: home.y + grab.y + moved.y };
}

// Where the finger was, and when: how far it had moved since touch-down.
type Sample = { t: number; moved: { x: number; y: number } };

// The samples a drop is judged from - enough to reach back past the lift.
const TRAIL_LENGTH = 12;

// How far the finger had moved DROP_LIFT_GRACE_MS before it lifted - what
// the piece and the guide were showing then - or, for a drag shorter than
// that, where it ended.
function movedBeforeLift(trail: Sample[], now: number) {
  'worklet';
  for (let i = trail.length - 1; i >= 0; i--) {
    if (now - trail[i].t >= DROP_LIFT_GRACE_MS) return trail[i].moved;
  }
  return trail.length > 0 ? trail[trail.length - 1].moved : { x: 0, y: 0 };
}

// Whether two squares touch, sides or corners.
function areNeighbours(a: Square, b: Square) {
  'worklet';
  const files = Math.abs(a.charCodeAt(0) - b.charCodeAt(0));
  const ranks = Math.abs(a.charCodeAt(1) - b.charCodeAt(1));
  return Math.max(files, ranks) === 1;
}

// What the gesture needs to know about the piece as it stands, read on the
// UI thread when the touch happens rather than captured when it was set up.
type PieceState = {
  square: Square;
  color: Color;
  width: number;
  orientation: Color;
  disabled: boolean;
};

// Interprets a piece's touches - tap vs. drag, where it's dragged to - on the
// UI thread: the piece is drawn bigger, a square above the finger, the drag
// guide marks the square under the finger - the one a drop counts for - and
// on release the piece goes straight to that square when it's a legal move
// (or home when it isn't), and a piece it takes disappears, before JS has
// heard about the drop at all. JS gets the outcome through the callbacks and
// stays the judge of the move - a drop it refuses is sent home from there.
export function usePieceGesture(props: PieceGestureInput): PieceGesture {
  const { x, y, legalTargets, dragGuide, captured = false, testID } = props;
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  // Where the finger went down, on screen, and where on the piece.
  const touchDown = useSharedValue({ x: 0, y: 0 });
  const grab = useSharedValue({ x: 0, y: 0 });
  // Where it has been since, as the piece was drawn - where it's dropped
  // from (see onDeactivate). Not where the finger lifts: in a quick flick
  // it's still travelling as it leaves the glass, so the lift lands past the
  // square the piece and the guide were showing.
  const trail = useSharedValue<Sample[]>([]);
  // Whether a drag is under way: Gesture Handler can report one that has
  // ended as cancelled too, straight after - it's set down only once.
  const dragging = useSharedValue(false);

  const piece = useSharedValue<PieceState>({
    square: props.square,
    color: props.color,
    width: props.width,
    orientation: props.orientation,
    disabled: props.disabled,
  });
  const { square, color, width, orientation, disabled } = props;
  useLayoutEffect(() => {
    piece.set({ square, color, width, orientation, disabled });
    // A piece dropped on a move stays above the rest until the game has made
    // the move (see onDeactivate) - from then it's drawn over them anyway, as
    // the piece just moved. Lowered too if it's taken, or play stops.
    zIndex.set(0);
  }, [piece, zIndex, square, color, width, orientation, disabled, captured]);

  const hidden = useDerivedValue(() => {
    const taken = dragGuide.taken.get();
    const { square, color } = piece.get();
    return taken !== null && taken.to === square && taken.color === color;
  });

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
        trail.set([]);
        const { square, width, orientation, disabled } = piece.get();
        grab.set(grabPoint(event, width, orientation));
        if (disabled) return;
        // The guide marks the piece's own square from touch-down, and its
        // square stays marked as where it came from until it's let go.
        const home = getXYFromSquare(square, width, orientation);
        dragGuide.x.set(home.x);
        dragGuide.y.set(home.y);
        dragGuide.opacity.set(1);
        dragGuide.origin.set(home);
        scheduleOnRN(report, 'onDragStart', square);
      },
      onActivate: (event) => {
        'worklet';
        dragging.set(true);
        // Where the drop goes even if no update follows before the release.
        trail.set([
          { t: Date.now(), moved: movedSinceTouchDown(touchDown.get(), event) },
        ]);
        if (piece.get().disabled) return;
        // Lifted at once, as on lichess.
        zIndex.set(DRAGGED_Z_INDEX);
        scale.set(DRAG_SCALE);
      },
      onUpdate: (event) => {
        'worklet';
        const { square, width, orientation, disabled } = piece.get();
        const moved = movedSinceTouchDown(touchDown.get(), event);
        trail.set([
          ...trail.get().slice(1 - TRAIL_LENGTH),
          { t: Date.now(), moved },
        ]);
        // Opponent pieces get no drag affordance at all - they're tap-only.
        if (disabled) return;
        const finger = fingerOnBoard(
          square,
          width,
          orientation,
          grab.get(),
          moved,
        );
        // Centred DRAG_LIFT squares above the finger, so neither the finger
        // hides it nor it seems to stand on the square the drop counts for.
        const drawn = toWhiteSide(
          {
            x: finger.x - width / 2,
            y: finger.y - width * DRAG_LIFT - width / 2,
          },
          width,
          orientation,
        );
        x.set(drawn.x);
        y.set(drawn.y);
        if (isOnBoard(finger, width)) {
          dragGuide.x.set(Math.floor(finger.x / width) * width);
          dragGuide.y.set(Math.floor(finger.y / width) * width);
          dragGuide.opacity.set(1);
        } else {
          dragGuide.opacity.set(0);
        }
      },
      onDeactivate: (event) => {
        'worklet';
        if (!dragging.get()) return;
        dragging.set(false);
        const { square, width, orientation, disabled } = piece.get();
        dragGuide.opacity.set(0);
        dragGuide.origin.set(null);
        const targets = legalTargets.get()[square] ?? [];
        const dropAt = (moved: { x: number; y: number }) => {
          const finger = fingerOnBoard(
            square,
            width,
            orientation,
            grab.get(),
            moved,
          );
          const onBoard = isOnBoard(finger, width);
          const at = getSquareFromXY(finger, width, orientation);
          return { to: at, legal: onBoard && targets.includes(at) };
        };
        // Where the finger was last seen - or, when that's no move, where it
        // was a moment before it lifted, when that is one: a finger leaving
        // the glass slides as it goes, often far enough in that last moment
        // to carry the drop off the square the guide was showing, onto one
        // it never got to show.
        const samples = trail.get();
        const last = samples.length > 0 ? samples[samples.length - 1] : null;
        let drop = dropAt(last ? last.moved : { x: 0, y: 0 });
        const liftedOn = drop.to;
        if (!drop.legal) {
          const before = dropAt(movedBeforeLift(samples, Date.now()));
          // Only a square next to it: a finger that crossed more than one
          // in that moment was thrown, not set down, and which square it
          // was meant for is anyone's guess - better home than a move not
          // meant.
          if (before.legal && areNeighbours(before.to, liftedOn)) {
            drop = before;
          }
        }
        const { to } = drop;
        const isMove = !event.canceled && drop.legal;
        // A piece standing there is taken: gone now, not once JS has made
        // the move.
        if (isMove && !disabled) {
          dragGuide.taken.set({
            from: square,
            to,
            color: otherColor(piece.get().color),
          });
        }

        if (!disabled) {
          // Set down at once on its square, or back home, as on lichess. On
          // a move it stays above the rest until JS has made it, which can
          // be a while after it's down (see the layout effect above):
          // lowered sooner, the piece it takes - drawn later, if it was the
          // last to move - would show on top of it in the meantime.
          scale.set(1);
          const target = getXYFromSquare(isMove ? to : square, width);
          x.set(target.x);
          y.set(target.y);
          if (!isMove) zIndex.set(0);
        }
        if (DRAG_LOG_ENABLED) {
          scheduleOnRN(
            logDrag,
            `board ${square}->${to} canceled=${event.canceled} isMove=${isMove} liftedOn=${liftedOn}`,
          );
        }
        if (!event.canceled) scheduleOnRN(report, 'onDragRelease', square, to);
      },
      onFinalize: () => {
        'worklet';
        // A touch that ended as a tap never moved the guide off the piece.
        dragGuide.opacity.set(0);
        dragGuide.origin.set(null);
      },
    }),
    [
      testID,
      captured,
      piece,
      touchDown,
      grab,
      trail,
      dragging,
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

  return { gesture, scale, zIndex, hidden };
}
