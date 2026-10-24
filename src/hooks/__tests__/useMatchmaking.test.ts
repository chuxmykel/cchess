import { act, renderHook } from '@testing-library/react-native';

import { useMatchmaking } from '../useMatchmaking';
import { useAuthSession } from '../../context/AuthSessionContext';
import { AppSocket } from '../../network/socketClient';
import { DEFAULT_TIME_CONTROL } from '../../constants/timeControls';
import { createFakeSocket } from '../../testUtils/fakeSocket';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));

function createNavigation() {
  return { replace: jest.fn(), goBack: jest.fn() };
}

function mockReadyAuthSession(socket: AppSocket) {
  (useAuthSession as jest.Mock).mockReturnValue({
    isReady: true,
    accessToken: 't',
    userId: 'u',
    socket,
  });
}

describe('useMatchmaking', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('reports isConnecting while there is no socket yet', async () => {
    (useAuthSession as jest.Mock).mockReturnValue({ isReady: false });
    const navigation = createNavigation();

    const { result } = await renderHook(() =>
      useMatchmaking(navigation, DEFAULT_TIME_CONTROL),
    );

    expect(result.current.isConnecting).toBe(true);
  });

  it('emits matchmaking:seek with the time control once the socket is ready', async () => {
    const { socket } = createFakeSocket();
    mockReadyAuthSession(socket);
    const navigation = createNavigation();

    const { result } = await renderHook(() =>
      useMatchmaking(navigation, DEFAULT_TIME_CONTROL),
    );

    expect(result.current.isConnecting).toBe(false);
    expect(socket.emit).toHaveBeenCalledWith('matchmaking:seek', {
      minutes: DEFAULT_TIME_CONTROL.minutes,
      incrementSeconds: DEFAULT_TIME_CONTROL.incrementSeconds,
      rated: false,
    });
  });

  it('replaces into Game when game:created arrives', async () => {
    const gameId = 'game-123';
    const { socket, trigger } = createFakeSocket();
    mockReadyAuthSession(socket);
    const navigation = createNavigation();

    await renderHook(() => useMatchmaking(navigation, DEFAULT_TIME_CONTROL));

    await act(() => {
      trigger('game:created', { id: gameId });
    });

    expect(navigation.replace).toHaveBeenCalledWith('LiveGame', {
      gameId,
    });
  });

  it('shows a toast and goes back on matchmaking:error', async () => {
    const errorMessage = 'No opponents available';
    const { socket, trigger } = createFakeSocket();
    mockReadyAuthSession(socket);
    const navigation = createNavigation();

    const { result } = await renderHook(() =>
      useMatchmaking(navigation, DEFAULT_TIME_CONTROL),
    );

    await act(() => {
      trigger('matchmaking:error', { message: errorMessage });
    });

    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(result.current.toasts.map((t) => t.message)).toEqual([errorMessage]);
  });

  it('cancels the seek on unmount', async () => {
    const { socket } = createFakeSocket();
    mockReadyAuthSession(socket);
    const navigation = createNavigation();

    const { unmount } = await renderHook(() =>
      useMatchmaking(navigation, DEFAULT_TIME_CONTROL),
    );

    await act(() => {
      unmount();
    });

    expect(socket.emit).toHaveBeenCalledWith('matchmaking:cancel');
  });

  it('cancel() navigates back', async () => {
    const { socket } = createFakeSocket();
    mockReadyAuthSession(socket);
    const navigation = createNavigation();

    const { result } = await renderHook(() =>
      useMatchmaking(navigation, DEFAULT_TIME_CONTROL),
    );

    await act(() => result.current.cancel());

    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});
