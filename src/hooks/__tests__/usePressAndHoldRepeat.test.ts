import { act, renderHook } from '@testing-library/react-native';

import {
  REPEAT_INTERVAL_MS,
  usePressAndHoldRepeat,
} from '../usePressAndHoldRepeat';

describe('usePressAndHoldRepeat', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  async function renderRepeat(enabled = true) {
    const action = jest.fn();
    const hook = await renderHook(
      ({ enabled }: { enabled: boolean }) =>
        usePressAndHoldRepeat(action, enabled),
      { initialProps: { enabled } },
    );
    return { action, ...hook };
  }

  it('runs once on a tap', async () => {
    const { action, result } = await renderRepeat();

    await act(() => result.current.onPress());

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('runs at once when held, then again every interval until let go', async () => {
    const { action, result } = await renderRepeat();

    await act(() => result.current.onLongPress());
    expect(action).toHaveBeenCalledTimes(1);

    await act(() => jest.advanceTimersByTime(3 * REPEAT_INTERVAL_MS));
    expect(action).toHaveBeenCalledTimes(4);

    await act(() => result.current.onPressOut());
    await act(() => jest.advanceTimersByTime(3 * REPEAT_INTERVAL_MS));
    expect(action).toHaveBeenCalledTimes(4);
  });

  it('stops once there is nothing left to step through', async () => {
    const { action, result, rerender } = await renderRepeat();

    await act(() => result.current.onLongPress());
    await rerender({ enabled: false });
    await act(() => jest.advanceTimersByTime(3 * REPEAT_INTERVAL_MS));

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('calls the action as it is at each step', async () => {
    const first = jest.fn();
    const second = jest.fn();
    const { result, rerender } = await renderHook(
      ({ action }: { action: () => void }) =>
        usePressAndHoldRepeat(action, true),
      { initialProps: { action: first } },
    );

    await act(() => result.current.onLongPress());
    await rerender({ action: second });
    await act(() => jest.advanceTimersByTime(REPEAT_INTERVAL_MS));

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('stops when unmounted', async () => {
    const { action, result, unmount } = await renderRepeat();

    await act(() => result.current.onLongPress());
    await unmount();
    jest.advanceTimersByTime(3 * REPEAT_INTERVAL_MS);

    expect(action).toHaveBeenCalledTimes(1);
  });
});
