import { fireEvent } from '@testing-library/react-native';
import type { TestInstance } from 'test-renderer';

// Builds the minimal `touchHistory` shape React Native's PanResponder reads
// to compute gestureState.dx/dy (see TouchHistoryMath.centroidDimension) -
// this is plain data, not anything requiring a real native touch bridge.
function touchHistoryAt(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  timestamp: number,
) {
  return {
    touchBank: [
      {
        touchActive: true,
        startPageX: startX,
        startPageY: startY,
        startTimeStamp: 0,
        currentPageX: currentX,
        currentPageY: currentY,
        currentTimeStamp: timestamp,
        previousPageX: startX,
        previousPageY: startY,
        previousTimeStamp: 0,
      },
    ],
    numberActiveTouches: 1,
    indexOfSingleActiveTouch: 0,
    mostRecentTimeStamp: timestamp,
  };
}

// Drives a component's PanResponder (attached via `{...panResponder.panHandlers}`)
// through a grant -> move -> release cycle, moving the finger by (dx, dy) from
// wherever it started. Absolute touch coordinates don't matter here - only the
// delta, since that's all gestureState.dx/dy (and therefore the component under
// test) ever sees.
export async function simulatePanResponderDrag(
  element: TestInstance,
  dx: number,
  dy: number,
) {
  await fireEvent(element, 'responderGrant', {
    touchHistory: touchHistoryAt(0, 0, 0, 0, 0),
  });
  await fireEvent(element, 'responderMove', {
    touchHistory: touchHistoryAt(0, 0, dx, dy, 100),
  });
  await fireEvent(element, 'responderRelease', {
    touchHistory: touchHistoryAt(0, 0, dx, dy, 100),
  });
}

// A tap through the same PanResponder path (as opposed to a Pressable's onPress) -
// net-zero movement, for exercising a component's own tap-vs-drag distinction.
export async function simulatePanResponderTap(element: TestInstance) {
  await simulatePanResponderDrag(element, 0, 0);
}

// Just the touch-down, with no move/release - for asserting on state that
// should already be correct the instant a gesture starts (e.g. anything
// that must stay in sync with the drag guide, which updates synchronously
// on grant, not after release).
export async function simulatePanResponderGrant(element: TestInstance) {
  await fireEvent(element, 'responderGrant', {
    touchHistory: touchHistoryAt(0, 0, 0, 0, 0),
  });
}

// Grant + move, with no release - for asserting on state that's only true
// mid-drag (e.g. zoom/scale feedback), which a full release would already
// have reverted by the time a post-drag assertion could observe it.
export async function simulatePanResponderGrantAndMove(
  element: TestInstance,
  dx: number,
  dy: number,
) {
  await fireEvent(element, 'responderGrant', {
    touchHistory: touchHistoryAt(0, 0, 0, 0, 0),
  });
  await fireEvent(element, 'responderMove', {
    touchHistory: touchHistoryAt(0, 0, dx, dy, 100),
  });
}
