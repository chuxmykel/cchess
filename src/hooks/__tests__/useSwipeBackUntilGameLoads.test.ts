import { renderHook } from '@testing-library/react-native';

import { useSwipeBackUntilGameLoads } from '../useSwipeBackUntilGameLoads';

describe('useSwipeBackUntilGameLoads', () => {
  it('allows swiping back while the game has not loaded', async () => {
    const navigation = { setOptions: jest.fn() };

    await renderHook(() => useSwipeBackUntilGameLoads(navigation, false));

    expect(navigation.setOptions).toHaveBeenCalledWith({
      gestureEnabled: true,
    });
  });

  it('leaves the gesture alone once the game has loaded', async () => {
    const navigation = { setOptions: jest.fn() };

    await renderHook(() => useSwipeBackUntilGameLoads(navigation, true));

    expect(navigation.setOptions).not.toHaveBeenCalled();
  });

  it('allows swiping back again when the screen goes back to waiting for a game', async () => {
    const navigation = { setOptions: jest.fn() };
    const { rerender } = await renderHook(
      (isGameLoaded: boolean) =>
        useSwipeBackUntilGameLoads(navigation, isGameLoaded),
      { initialProps: true },
    );

    await rerender(false);

    expect(navigation.setOptions).toHaveBeenCalledWith({
      gestureEnabled: true,
    });
  });
});
