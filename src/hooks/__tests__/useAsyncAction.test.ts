import { act, renderHook } from '@testing-library/react-native';

import { useAsyncAction } from '../useAsyncAction';
import { ApiError } from '../../network/restClient';

const FALLBACK = "Couldn't sign in. Please try again.";

describe('useAsyncAction', () => {
  it('reports success and clears the running state', async () => {
    const action = jest.fn().mockResolvedValue(undefined);
    const { result } = await renderHook(() => useAsyncAction(action, FALLBACK));

    let succeeded: boolean;
    await act(async () => {
      succeeded = await result.current.run();
    });

    expect(succeeded).toBe(true);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.errorMessage).toBeNull();
  });

  it("shows the server's message when the server rejects the form", async () => {
    const action = jest
      .fn()
      .mockRejectedValue(new ApiError(409, 'Username is already taken'));
    const { result } = await renderHook(() => useAsyncAction(action, FALLBACK));

    let succeeded: boolean;
    await act(async () => {
      succeeded = await result.current.run();
    });

    expect(succeeded).toBe(false);
    expect(result.current.errorMessage).toBe('Username is already taken');
  });

  it.each([
    ['the server could not be reached', new ApiError(0, 'Network Error')],
    ['something else went wrong', new Error('undefined is not a function')],
  ])('shows the fallback message when %s', async (_, failure) => {
    const action = jest.fn().mockRejectedValue(failure);
    const { result } = await renderHook(() => useAsyncAction(action, FALLBACK));

    await act(() => result.current.run());

    expect(result.current.errorMessage).toBe(FALLBACK);
  });

  it('clears the previous error when running again', async () => {
    const action = jest
      .fn()
      .mockRejectedValueOnce(new ApiError(401, 'Invalid credentials'))
      .mockResolvedValueOnce(undefined);
    const { result } = await renderHook(() => useAsyncAction(action, FALLBACK));

    await act(() => result.current.run());
    await act(() => result.current.run());

    expect(result.current.errorMessage).toBeNull();
  });

  it('ignores a second run while the first is still in flight', async () => {
    let finish: () => void;
    const action = jest.fn(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    const { result } = await renderHook(() => useAsyncAction(action, FALLBACK));

    let first: Promise<boolean>;
    await act(async () => {
      first = result.current.run();
    });
    expect(result.current.isRunning).toBe(true);

    await act(async () => {
      await expect(result.current.run()).resolves.toBe(false);
    });
    await act(async () => {
      finish();
      await first;
    });

    expect(action).toHaveBeenCalledTimes(1);
  });
});
