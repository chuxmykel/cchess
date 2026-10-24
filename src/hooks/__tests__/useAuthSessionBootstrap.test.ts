import { waitFor, renderHook } from '@testing-library/react-native';

import {
  AUTH_SESSION_STATUS,
  useAuthSessionBootstrap,
} from '../useAuthSessionBootstrap';
import { createGuestSession } from '../../network/restClient';
import {
  AppSocket,
  connectSocket,
  waitForServerRejection,
} from '../../network/socketClient';
import { clearTokens, getTokens, saveTokens } from '../../network/tokenStorage';

jest.mock('../../network/restClient');
jest.mock('../../network/socketClient');
jest.mock('../../network/tokenStorage');

const SESSION = {
  accessToken: 'access-123',
  refreshToken: 'refresh-456',
  userId: 'user-789',
};

const FRESH_SESSION = {
  accessToken: 'access-fresh',
  refreshToken: 'refresh-fresh',
  userId: 'user-fresh',
};

const FAKE_SOCKET = { id: 'fake-socket' } as unknown as AppSocket;
const FRESH_SOCKET = { id: 'fresh-socket' } as unknown as AppSocket;

describe('useAuthSessionBootstrap', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates and persists a guest session on a fresh install', async () => {
    (getTokens as jest.Mock).mockResolvedValue(null);
    (createGuestSession as jest.Mock).mockResolvedValue(SESSION);
    (connectSocket as jest.Mock).mockReturnValue(FAKE_SOCKET);

    const { result } = await renderHook(() => useAuthSessionBootstrap());

    await waitFor(() =>
      expect(result.current).toEqual({
        status: AUTH_SESSION_STATUS.READY,
        isReady: true,
        accessToken: SESSION.accessToken,
        userId: SESSION.userId,
        socket: FAKE_SOCKET,
      }),
    );

    expect(saveTokens).toHaveBeenCalledWith(SESSION);
    expect(connectSocket).toHaveBeenCalledWith(SESSION.accessToken);
  });

  it('reuses stored tokens without calling /auth/guest again', async () => {
    (getTokens as jest.Mock).mockResolvedValue(SESSION);
    (connectSocket as jest.Mock).mockReturnValue(FAKE_SOCKET);

    const { result } = await renderHook(() => useAuthSessionBootstrap());

    await waitFor(() =>
      expect(result.current.status).toBe(AUTH_SESSION_STATUS.READY),
    );

    expect(createGuestSession).not.toHaveBeenCalled();
    expect(saveTokens).not.toHaveBeenCalled();
    expect(connectSocket).toHaveBeenCalledWith(SESSION.accessToken);
  });

  it('refreshes with a brand new guest session when the server rejects a stored one', async () => {
    (getTokens as jest.Mock).mockResolvedValue(SESSION);
    (waitForServerRejection as jest.Mock).mockResolvedValue(true);
    (createGuestSession as jest.Mock).mockResolvedValue(FRESH_SESSION);
    (connectSocket as jest.Mock)
      .mockReturnValueOnce(FAKE_SOCKET)
      .mockReturnValueOnce(FRESH_SOCKET);

    const { result } = await renderHook(() => useAuthSessionBootstrap());

    await waitFor(() =>
      expect(result.current).toEqual({
        status: AUTH_SESSION_STATUS.READY,
        isReady: true,
        accessToken: FRESH_SESSION.accessToken,
        userId: FRESH_SESSION.userId,
        socket: FRESH_SOCKET,
      }),
    );

    expect(clearTokens).toHaveBeenCalledTimes(1);
    expect(saveTokens).toHaveBeenCalledWith(FRESH_SESSION);
    expect(connectSocket).toHaveBeenNthCalledWith(1, SESSION.accessToken);
    expect(connectSocket).toHaveBeenNthCalledWith(2, FRESH_SESSION.accessToken);
  });

  it('does not retry a freshly-created guest session even if it is rejected', async () => {
    (getTokens as jest.Mock).mockResolvedValue(null);
    (createGuestSession as jest.Mock).mockResolvedValue(SESSION);
    (waitForServerRejection as jest.Mock).mockResolvedValue(true);
    (connectSocket as jest.Mock).mockReturnValue(FAKE_SOCKET);

    const { result } = await renderHook(() => useAuthSessionBootstrap());

    await waitFor(() =>
      expect(result.current.status).toBe(AUTH_SESSION_STATUS.READY),
    );

    expect(createGuestSession).toHaveBeenCalledTimes(1);
    expect(clearTokens).not.toHaveBeenCalled();
    expect(connectSocket).toHaveBeenCalledTimes(1);
  });
});
