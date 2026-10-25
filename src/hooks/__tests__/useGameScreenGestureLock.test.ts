import { act, renderHook } from '@testing-library/react-native';

import { useGameScreenGestureLock } from '../useGameScreenGestureLock';

describe('useGameScreenGestureLock', () => {
  it('locks the gesture while the game is in progress', async () => {
    const setOptions = jest.fn();

    await renderHook(() => useGameScreenGestureLock({ setOptions }, false));

    expect(setOptions).toHaveBeenCalledWith({ gestureEnabled: false });
  });

  it('unlocks the gesture once the game is over', async () => {
    const setOptions = jest.fn();
    const { rerender } = await renderHook(
      ({ isGameOver }) => useGameScreenGestureLock({ setOptions }, isGameOver),
      { initialProps: { isGameOver: false } },
    );

    await act(async () => {
      rerender({ isGameOver: true });
    });

    expect(setOptions).toHaveBeenLastCalledWith({ gestureEnabled: true });
  });
});
