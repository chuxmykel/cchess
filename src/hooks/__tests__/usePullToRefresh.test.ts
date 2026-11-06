import { act, renderHook } from '@testing-library/react-native';

import { usePullToRefresh } from '../usePullToRefresh';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('usePullToRefresh', () => {
  it('runs every reload, refreshing until the last has finished', async () => {
    const first = deferred();
    const second = deferred();
    const reloadFirst = jest.fn(() => first.promise);
    const reloadSecond = jest.fn(() => second.promise);
    const { result } = await renderHook(() =>
      usePullToRefresh(reloadFirst, reloadSecond),
    );
    expect(result.current.refreshing).toBe(false);

    await act(async () => result.current.onRefresh());
    expect(reloadFirst).toHaveBeenCalledTimes(1);
    expect(reloadSecond).toHaveBeenCalledTimes(1);
    expect(result.current.refreshing).toBe(true);

    await act(async () => first.resolve());
    expect(result.current.refreshing).toBe(true);
    await act(async () => second.resolve());
    expect(result.current.refreshing).toBe(false);
  });

  it('stops refreshing when a reload fails, or returns nothing', async () => {
    const { result } = await renderHook(() =>
      usePullToRefresh(
        () => Promise.reject(new Error('offline')),
        () => undefined,
      ),
    );

    await act(async () => result.current.onRefresh());

    expect(result.current.refreshing).toBe(false);
  });

  it('runs the reloads given last', async () => {
    const before = jest.fn();
    const after = jest.fn();
    const { result, rerender } = await renderHook(
      ({ reload }) => usePullToRefresh(reload),
      { initialProps: { reload: before } },
    );
    await rerender({ reload: after });

    await act(async () => result.current.onRefresh());

    expect(before).not.toHaveBeenCalled();
    expect(after).toHaveBeenCalled();
  });
});
