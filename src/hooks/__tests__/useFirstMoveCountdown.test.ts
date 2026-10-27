import { act, renderHook } from '@testing-library/react-native';

import { useFirstMoveCountdown } from '../useFirstMoveCountdown';

const NOW = Date.parse('2026-10-27T10:00:00Z');

describe('useFirstMoveCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('has nothing to count without a deadline', async () => {
    const { result } = await renderHook(() => useFirstMoveCountdown(null));

    await act(() => jest.advanceTimersByTime(500));

    expect(result.current).toBeNull();
  });

  it('counts the whole seconds down to the deadline', async () => {
    const { result } = await renderHook(() =>
      useFirstMoveCountdown('2026-10-27T10:00:30Z'),
    );

    await act(() => jest.advanceTimersByTime(0));
    expect(result.current).toBe(30);

    await act(() => jest.advanceTimersByTime(20_250));
    expect(result.current).toBe(10);
  });

  it('stops at 0', async () => {
    const { result } = await renderHook(() =>
      useFirstMoveCountdown('2026-10-27T10:00:01Z'),
    );

    await act(() => jest.advanceTimersByTime(5000));

    expect(result.current).toBe(0);
  });

  it('forgets the old count when the deadline goes away', async () => {
    const { result, rerender } = await renderHook(
      (deadline: string | null) => useFirstMoveCountdown(deadline),
      { initialProps: '2026-10-27T10:00:30Z' as string | null },
    );
    await act(() => jest.advanceTimersByTime(0));

    await rerender(null);

    expect(result.current).toBeNull();
  });
});
