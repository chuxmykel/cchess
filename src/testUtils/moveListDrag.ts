import { act } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import {
  fireGestureHandler,
  getByGestureTestId,
} from 'react-native-gesture-handler/jest-utils';

// Drags a MoveList sideways by `dx` - negative to the left - through its
// Gesture Handler pan, as a finger would on a device.
export async function dragSideways(dx: number) {
  await act(async () => {
    fireGestureHandler(getByGestureTestId('move-list-drag'), [
      { state: State.BEGAN, translationX: 0 },
      { state: State.ACTIVE, translationX: 0 },
      { state: State.ACTIVE, translationX: dx / 2 },
      { state: State.ACTIVE, translationX: dx },
      { state: State.END, translationX: dx },
    ]);
  });
}
