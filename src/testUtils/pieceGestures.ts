import { act } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import {
  createGestureController,
  fireGestureHandler,
  getByGestureTestId,
} from 'react-native-gesture-handler/jest-utils';

// Drives a board piece's gestures (see usePieceGesture) the way Gesture
// Handler would on a device, by the testID the piece was rendered with -
// its gestures are `${testID}-pan` and `${testID}-tap`. Their callbacks
// are worklets that reach JS through scheduleOnRN, and pieces move by
// springs, both of which run on timers here: tests using these need
// jest.useFakeTimers().

/** Lets springs finish and scheduled callbacks reach JS. */
export async function settleAnimations(ms = 1000) {
  await act(() => {
    jest.advanceTimersByTime(ms);
  });
}

function firePan(testID: string, events: object[]) {
  fireGestureHandler(getByGestureTestId(`${testID}-pan`), events);
}

function panController(testID: string) {
  return createGestureController<{
    translationX: number;
    translationY: number;
  }>(getByGestureTestId(`${testID}-pan`) as never);
}

// fireGestureHandler finishes any gesture its events leave open, so a touch
// still held is driven a step at a time instead.

/** A finger put down on the piece, not yet moved or lifted. */
export async function touchPiece(testID: string) {
  await act(() => panController(testID).begin());
  await settleAnimations(16);
}

/** A drag by (dx, dy), still held - the finger not yet lifted. */
export async function holdDrag(testID: string, dx: number, dy: number) {
  const pan = panController(testID);
  await act(() => {
    pan.begin({ translationX: 0, translationY: 0 });
    pan.activate({ translationX: 0, translationY: 0 });
    pan.update({ translationX: dx, translationY: dy });
  });
  await settleAnimations(16);
}

/** A drag by (dx, dy) and release, then everything left to settle. */
export async function dragPiece(testID: string, dx: number, dy: number) {
  await act(() =>
    firePan(testID, [
      { state: State.BEGAN, translationX: 0, translationY: 0 },
      { state: State.ACTIVE, translationX: 0, translationY: 0 },
      { state: State.ACTIVE, translationX: dx, translationY: dy },
      { state: State.END, translationX: dx, translationY: dy },
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
