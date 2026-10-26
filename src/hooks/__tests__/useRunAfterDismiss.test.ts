import { act, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { useRunAfterDismiss } from '../useRunAfterDismiss';

describe('useRunAfterDismiss', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
  });

  it('on iOS, holds the action until the modal is dismissed', async () => {
    Platform.OS = 'ios';
    const action = jest.fn();
    const { result } = await renderHook(() => useRunAfterDismiss());

    await act(() => result.current.runAfterDismiss(action));
    expect(action).not.toHaveBeenCalled();

    await act(() => result.current.handleDismiss());
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('runs a held action only once', async () => {
    Platform.OS = 'ios';
    const action = jest.fn();
    const { result } = await renderHook(() => useRunAfterDismiss());

    await act(() => result.current.runAfterDismiss(action));
    await act(() => result.current.handleDismiss());
    await act(() => result.current.handleDismiss());

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('does nothing on dismiss when no action is waiting', async () => {
    Platform.OS = 'ios';
    const { result } = await renderHook(() => useRunAfterDismiss());

    expect(() => result.current.handleDismiss()).not.toThrow();
  });

  it('runs the action straight away on other platforms', async () => {
    Platform.OS = 'android';
    const action = jest.fn();
    const { result } = await renderHook(() => useRunAfterDismiss());

    await act(() => result.current.runAfterDismiss(action));

    expect(action).toHaveBeenCalledTimes(1);
  });
});
