import { act, renderHook } from '@testing-library/react-native';

import { useMatchmaking } from '../useMatchmaking';
import { useAuthSession } from '../../context/AuthSessionContext';
import { AppSocket } from '../../network/socketClient';
import { DEFAULT_TIME_CONTROL } from '../../constants/timeControls';
import { Seek } from '../../constants/seek';
import { MATCHMAKING_FAILED_MESSAGE } from '../../constants/errorMessages';
import { createFakeSocket } from '../../testUtils/fakeSocket';
import {
  makeAuthSession,
  makeBootstrappingAuthSession,
} from '../../testUtils/authSession';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));

function mockReadyAuthSession(socket: AppSocket) {
  (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession({ socket }));
}

const RATED_SEEK: Seek = {
  timeControl: DEFAULT_TIME_CONTROL,
  rated: true,
  ratingRange: { below: 200, above: 300 },
};

function createCallbacks() {
  return { onMatched: jest.fn(), onError: jest.fn() };
}

describe('useMatchmaking', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('reports isConnecting while there is no socket yet', async () => {
    (useAuthSession as jest.Mock).mockReturnValue(
      makeBootstrappingAuthSession(),
    );

    const { result } = await renderHook(() =>
      useMatchmaking(RATED_SEEK, createCallbacks()),
    );

    expect(result.current.isConnecting).toBe(true);
  });

  it('emits matchmaking:seek with the seek options once the socket is ready', async () => {
    const { socket } = createFakeSocket();
    mockReadyAuthSession(socket);

    const { result } = await renderHook(() =>
      useMatchmaking(RATED_SEEK, createCallbacks()),
    );

    expect(result.current.isConnecting).toBe(false);
    expect(socket.emit).toHaveBeenCalledWith('matchmaking:seek', {
      initialSeconds: DEFAULT_TIME_CONTROL.initialSeconds,
      incrementSeconds: DEFAULT_TIME_CONTROL.incrementSeconds,
      rated: true,
      ratingRange: { below: 200, above: 300 },
    });
  });

  it("doesn't seek without a seek", async () => {
    const { socket } = createFakeSocket();
    mockReadyAuthSession(socket);

    await renderHook(() => useMatchmaking(null, createCallbacks()));

    expect(socket.emit).not.toHaveBeenCalled();
  });

  it('reports the new game when game:created arrives', async () => {
    const { socket, trigger } = createFakeSocket();
    mockReadyAuthSession(socket);
    const callbacks = createCallbacks();

    await renderHook(() => useMatchmaking(RATED_SEEK, callbacks));
    await act(() => {
      trigger('game:created', { id: 'game-123' });
    });

    expect(callbacks.onMatched).toHaveBeenCalledWith('game-123');
  });

  it('reports matchmaking:error, falling back to a default message', async () => {
    const { socket, trigger } = createFakeSocket();
    mockReadyAuthSession(socket);
    const callbacks = createCallbacks();

    await renderHook(() => useMatchmaking(RATED_SEEK, callbacks));
    await act(() => {
      trigger('matchmaking:error', { message: 'No opponents available' });
    });
    await act(() => {
      trigger('matchmaking:error', { message: '' });
    });

    expect(callbacks.onError).toHaveBeenNthCalledWith(
      1,
      'No opponents available',
    );
    expect(callbacks.onError).toHaveBeenNthCalledWith(
      2,
      MATCHMAKING_FAILED_MESSAGE,
    );
  });

  it('uses the latest callbacks without restarting the seek', async () => {
    const { socket, trigger } = createFakeSocket();
    mockReadyAuthSession(socket);
    const first = createCallbacks();
    const second = createCallbacks();

    const { rerender } = await renderHook(
      (callbacks: ReturnType<typeof createCallbacks>) =>
        useMatchmaking(RATED_SEEK, callbacks),
      { initialProps: first },
    );
    await rerender(second);
    await act(() => {
      trigger('game:created', { id: 'game-123' });
    });

    expect(first.onMatched).not.toHaveBeenCalled();
    expect(second.onMatched).toHaveBeenCalledWith('game-123');
    expect(socket.emit).toHaveBeenCalledTimes(1);
  });

  it('cancels the seek when it is taken away', async () => {
    const { socket } = createFakeSocket();
    mockReadyAuthSession(socket);
    const callbacks = createCallbacks();

    const { rerender } = await renderHook(
      (seek: Seek | null) => useMatchmaking(seek, callbacks),
      { initialProps: RATED_SEEK as Seek | null },
    );
    await rerender(null);

    expect(socket.emit).toHaveBeenLastCalledWith('matchmaking:cancel');
  });

  it('cancels the seek on unmount', async () => {
    const { socket } = createFakeSocket();
    mockReadyAuthSession(socket);

    const { unmount } = await renderHook(() =>
      useMatchmaking(RATED_SEEK, createCallbacks()),
    );
    await act(() => {
      unmount();
    });

    expect(socket.emit).toHaveBeenCalledWith('matchmaking:cancel');
  });
});
