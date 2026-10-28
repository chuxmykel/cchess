import { act, renderHook } from '@testing-library/react-native';
import { Animated } from 'react-native';

import { useKeyboardHeight } from '../useKeyboardHeight';
import { captureKeyboardListeners } from '../../testUtils/keyboard';

function valueOf(height: Animated.Value): number {
  return (height as unknown as { __getValue: () => number }).__getValue();
}

describe('useKeyboardHeight', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('follows the keyboard as it shows and hides', async () => {
    const keyboard = captureKeyboardListeners();
    const { result } = await renderHook(() => useKeyboardHeight());
    expect(valueOf(result.current)).toBe(0);

    await act(() => {
      keyboard.show(336);
      jest.advanceTimersByTime(500);
    });
    expect(valueOf(result.current)).toBe(336);

    await act(() => {
      keyboard.hide();
      jest.advanceTimersByTime(500);
    });
    expect(valueOf(result.current)).toBe(0);
  });

  it('follows the keyboard without re-rendering', async () => {
    const keyboard = captureKeyboardListeners();
    let renders = 0;
    await renderHook(() => {
      renders += 1;
      return useKeyboardHeight();
    });
    const rendersBefore = renders;

    await act(() => {
      keyboard.show(336);
      jest.advanceTimersByTime(500);
    });

    expect(renders).toBe(rendersBefore);
  });
});
