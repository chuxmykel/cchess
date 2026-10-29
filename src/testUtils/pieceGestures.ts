import { act } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import {
  createGestureController,
  fireGestureHandler,
  getByGestureTestId,
} from 'react-native-gesture-handler/jest-utils';

import { TAP_MOVEMENT_THRESHOLD } from '../constants';

// Drives a board piece's gestures (see usePieceGesture) the way Gesture
// Handler would on a device, by the testID the piece was rendered with -
// its gestures are `${testID}-pan` and `${testID}-tap`. Their callbacks
// are worklets that reach JS through scheduleOnRN, and pieces move by
// timed animations, both of which run on timers here: tests using these need
// jest.useFakeTimers().

/** Lets animations finish and scheduled callbacks reach JS. */
export async function settleAnimations(ms = 1000) {
  await act(() => {
    jest.advanceTimersByTime(ms);
  });
}

function firePan(testID: string, events: object[]) {
  fireGestureHandler(getByGestureTestId(`${testID}-pan`), events);
}

function panController(testID: string) {
  return createGestureController<Record<string, number>>(
    getByGestureTestId(`${testID}-pan`) as never,
  );
}

// Where the finger goes down, on screen - any point will do.
const TOUCH_DOWN = { x: 100, y: 300 };

// A drag's events as Gesture Handler sends them on iOS: the finger moves
// TAP_MOVEMENT_THRESHOLD points, where the drag activates, then on by
// (dx, dy) in all. Absolute positions count from the touch-down; translation
// only from the activation - it's reset there.
function dragEvents(dx: number, dy: number) {
  const distance = Math.hypot(dx, dy);
  const step = distance === 0 ? 0 : TAP_MOVEMENT_THRESHOLD / distance;
  const activation = { x: dx * step, y: dy * step };
  const at = (moved: { x: number; y: number }) => ({
    absoluteX: TOUCH_DOWN.x + moved.x,
    absoluteY: TOUCH_DOWN.y + moved.y,
    translationX: moved.x - activation.x,
    translationY: moved.y - activation.y,
  });
  return {
    begin: { absoluteX: TOUCH_DOWN.x, absoluteY: TOUCH_DOWN.y },
    activate: at(activation),
    moved: at({ x: dx, y: dy }),
  };
}

// fireGestureHandler finishes any gesture its events leave open, so a touch
// still held is driven a step at a time instead.

/** A finger put down on the piece, not yet moved or lifted. */
export async function touchPiece(testID: string) {
  await act(() => panController(testID).begin(dragEvents(0, 0).begin));
  await settleAnimations(16);
}

/** A drag by (dx, dy), still held - the finger not yet lifted. */
export async function holdDrag(testID: string, dx: number, dy: number) {
  const pan = panController(testID);
  const events = dragEvents(dx, dy);
  await act(() => {
    pan.begin(events.begin);
    pan.activate(events.activate);
    pan.update(events.moved);
  });
  await settleAnimations(16);
}

/** A drag by (dx, dy) and release, then everything left to settle. */
export async function dragPiece(testID: string, dx: number, dy: number) {
  const events = dragEvents(dx, dy);
  await act(() =>
    firePan(testID, [
      { state: State.BEGAN, ...events.begin },
      { state: State.ACTIVE, ...events.activate },
      { state: State.ACTIVE, ...events.moved },
      { state: State.END, ...events.moved },
    ]),
  );
  await settleAnimations();
}

/** A quick flick: dragged by (dx, dy), where the piece is last drawn, but
 * lifted further on - by (liftDx, liftDy) in all - as a finger still
 * travelling leaves the glass. */
export async function flickPiece(
  testID: string,
  dx: number,
  dy: number,
  liftDx: number,
  liftDy: number,
) {
  const events = dragEvents(dx, dy);
  const lifted = dragEvents(liftDx, liftDy).moved;
  await act(() =>
    firePan(testID, [
      { state: State.BEGAN, ...events.begin },
      { state: State.ACTIVE, ...events.activate },
      { state: State.ACTIVE, ...events.moved },
      { state: State.END, ...lifted },
    ]),
  );
  await settleAnimations();
}

/** A tap: the drag gesture starts on touch-down, then fails as the finger
 * lifts without moving far enough, so the tap wins. */
export async function tapPiece(testID: string) {
  await act(() =>
    firePan(testID, [{ state: State.BEGAN }, { state: State.FAILED }]),
  );
  await act(() =>
    fireGestureHandler(getByGestureTestId(`${testID}-tap`), [
      { state: State.BEGAN },
      { state: State.ACTIVE },
      { state: State.END },
    ]),
  );
  await settleAnimations();
}
