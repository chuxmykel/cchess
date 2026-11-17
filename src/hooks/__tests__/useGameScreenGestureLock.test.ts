import { act, renderHook } from '@testing-library/react-native';
import { BackHandler } from 'react-native';

import { useGameScreenGestureLock } from '../useGameScreenGestureLock';

describe('useGameScreenGestureLock', () => {
  // Android's back button and gesture reach the app as a hardwareBackPress
  // event; a listener returning true keeps the screen where it is.
  function captureBackListeners() {
    const listeners: { handler: () => boolean; removed: boolean }[] = [];
    jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((_event, handler) => {
        const listener = { handler: handler as () => boolean, removed: false };
        listeners.push(listener);
        return {
          remove: () => {
            listener.removed = true;
          },
        };
      });
    return () => listeners.filter((listener) => !listener.removed);
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

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

  it("refuses Android's back while the game is in progress", async () => {
    const activeListeners = captureBackListeners();

    await renderHook(() =>
      useGameScreenGestureLock({ setOptions: jest.fn() }, false),
    );

    expect(activeListeners()).toHaveLength(1);
    expect(activeListeners()[0].handler()).toBe(true);
  });

  it('lets back through once the game is over, and on leaving', async () => {
    const activeListeners = captureBackListeners();
    const { rerender, unmount } = await renderHook(
      ({ isGameOver }) =>
        useGameScreenGestureLock({ setOptions: jest.fn() }, isGameOver),
      { initialProps: { isGameOver: false } },
    );

    await act(async () => {
      rerender({ isGameOver: true });
    });
    expect(activeListeners()).toHaveLength(0);

    await act(async () => {
      rerender({ isGameOver: false });
    });
    expect(activeListeners()).toHaveLength(1);

    await act(async () => {
      unmount();
    });
    expect(activeListeners()).toHaveLength(0);
  });
});
