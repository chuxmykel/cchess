import { StrictMode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  AUTH_SESSION_STATUS,
  useAuthSessionLifecycle,
} from '../useAuthSessionLifecycle';
import {
  ApiError,
  AuthResponse,
  createGuestSession,
  getMe,
  refreshSession,
  register,
  revokeRefreshToken,
  signIn,
} from '../../network/restClient';
import { AppSocket, connectSocket } from '../../network/socketClient';
import { getRefreshToken, saveRefreshToken } from '../../network/tokenStorage';
import { makeAccountUser } from '../../testUtils/authSession';

jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  createGuestSession: jest.fn(),
  signIn: jest.fn(),
  register: jest.fn(),
  refreshSession: jest.fn(),
  revokeRefreshToken: jest.fn(),
  getMe: jest.fn(),
}));
jest.mock('../../network/socketClient');
jest.mock('../../network/tokenStorage');

function makeAuthResponse(name: string, isGuest: boolean): AuthResponse {
  return {
    accessToken: `access-${name}`,
    refreshToken: `refresh-${name}`,
    user: makeAccountUser({ id: name, username: name, isGuest }),
  };
}

const GUEST = makeAuthResponse('guest', true);
const ANOTHER_GUEST = makeAuthResponse('another-guest', true);
const MAGNUS = makeAuthResponse('magnus', false);
const CREDENTIALS = { usernameOrEmail: 'magnus', password: 'secret123' };

function socketFor(accessToken: string) {
  return { token: accessToken } as unknown as AppSocket;
}

function deferred<T>() {
  let resolve: (value: T) => void;
  let reject: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function renderSignedInAs(response: AuthResponse) {
  (getRefreshToken as jest.Mock).mockResolvedValue(response.refreshToken);
  (refreshSession as jest.Mock).mockResolvedValue(response);
  const rendered = await renderHook(() => useAuthSessionLifecycle());
  await waitFor(() => expect(rendered.result.current.isReady).toBe(true));
  jest.clearAllMocks();
  return rendered;
}

describe('useAuthSessionLifecycle', () => {
  beforeEach(() => {
    (connectSocket as jest.Mock).mockImplementation(socketFor);
    (revokeRefreshToken as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('on launch', () => {
    it('starts as a new guest on a fresh install', async () => {
      (getRefreshToken as jest.Mock).mockResolvedValue(null);
      (createGuestSession as jest.Mock).mockResolvedValue(GUEST);

      const { result } = await renderHook(() => useAuthSessionLifecycle());

      await waitFor(() =>
        expect(result.current).toMatchObject({
          status: AUTH_SESSION_STATUS.READY,
          accessToken: GUEST.accessToken,
          user: GUEST.user,
          socket: socketFor(GUEST.accessToken),
        }),
      );
      expect(saveRefreshToken).toHaveBeenCalledWith(GUEST.refreshToken);
    });

    it('resumes the stored account with a freshly refreshed session', async () => {
      (getRefreshToken as jest.Mock).mockResolvedValue('refresh-stored');
      (refreshSession as jest.Mock).mockResolvedValue(MAGNUS);

      const { result } = await renderHook(() => useAuthSessionLifecycle());

      await waitFor(() =>
        expect(result.current).toMatchObject({
          accessToken: MAGNUS.accessToken,
          user: MAGNUS.user,
        }),
      );
      expect(refreshSession).toHaveBeenCalledWith('refresh-stored');
      expect(saveRefreshToken).toHaveBeenCalledWith(MAGNUS.refreshToken);
      expect(createGuestSession).not.toHaveBeenCalled();
    });

    it('refreshes the stored session only once under StrictMode', async () => {
      (getRefreshToken as jest.Mock).mockResolvedValue('refresh-stored');
      (refreshSession as jest.Mock).mockResolvedValue(MAGNUS);

      const { result } = await renderHook(() => useAuthSessionLifecycle(), {
        wrapper: StrictMode,
      });

      await waitFor(() => expect(result.current.isReady).toBe(true));
      expect(refreshSession).toHaveBeenCalledTimes(1);
      expect(result.current).toMatchObject({ user: MAGNUS.user });
    });

    it('starts as a new guest when the server rejects the stored session', async () => {
      (getRefreshToken as jest.Mock).mockResolvedValue('refresh-expired');
      (refreshSession as jest.Mock).mockRejectedValue(
        new ApiError(401, 'Invalid or expired refresh token'),
      );
      (createGuestSession as jest.Mock).mockResolvedValue(GUEST);

      const { result } = await renderHook(() => useAuthSessionLifecycle());

      await waitFor(() => expect(result.current.isReady).toBe(true));
      expect(result.current).toMatchObject({ user: GUEST.user });
    });

    it('keeps the stored account and reports an error when the server is unreachable', async () => {
      (getRefreshToken as jest.Mock).mockResolvedValue('refresh-stored');
      (refreshSession as jest.Mock).mockRejectedValue(
        new ApiError(0, 'Network Error'),
      );

      const { result } = await renderHook(() => useAuthSessionLifecycle());

      await waitFor(() =>
        expect(result.current.status).toBe(AUTH_SESSION_STATUS.ERROR),
      );
      expect(createGuestSession).not.toHaveBeenCalled();
      expect(saveRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('switching accounts', () => {
    it.each([
      ['signing in', signIn, (session) => session.signIn(CREDENTIALS)],
      [
        'creating an account',
        register,
        (session) =>
          session.register({
            username: 'magnus',
            email: 'm@example.com',
            password: 'secret123',
          }),
      ],
    ] as const)(
      '%s replaces the guest session and revokes it',
      async (_, request, switchAccount) => {
        const { result } = await renderSignedInAs(GUEST);
        (request as jest.Mock).mockResolvedValue(MAGNUS);

        await act(() => switchAccount(result.current));

        expect(result.current).toMatchObject({
          accessToken: MAGNUS.accessToken,
          user: MAGNUS.user,
          socket: socketFor(MAGNUS.accessToken),
        });
        expect(saveRefreshToken).toHaveBeenCalledWith(MAGNUS.refreshToken);
        expect(revokeRefreshToken).toHaveBeenCalledWith(GUEST.refreshToken);
      },
    );

    it('stays on the current session when signing in fails', async () => {
      const { result } = await renderSignedInAs(GUEST);
      const failure = new ApiError(401, 'Invalid credentials');
      (signIn as jest.Mock).mockRejectedValue(failure);

      await act(() =>
        expect(result.current.signIn(CREDENTIALS)).rejects.toBe(failure),
      );

      expect(result.current).toMatchObject({ user: GUEST.user });
      expect(saveRefreshToken).not.toHaveBeenCalled();
      expect(revokeRefreshToken).not.toHaveBeenCalled();
    });

    it('signs out to a new guest session and revokes the account session', async () => {
      const { result } = await renderSignedInAs(MAGNUS);
      (createGuestSession as jest.Mock).mockResolvedValue(ANOTHER_GUEST);

      await act(() => result.current.signOut());

      expect(result.current).toMatchObject({ user: ANOTHER_GUEST.user });
      expect(revokeRefreshToken).toHaveBeenCalledWith(MAGNUS.refreshToken);
    });

    it('stays signed in when the new guest session cannot be created', async () => {
      const { result } = await renderSignedInAs(MAGNUS);
      (createGuestSession as jest.Mock).mockRejectedValue(
        new ApiError(0, 'Network Error'),
      );

      await act(() =>
        expect(result.current.signOut()).rejects.toBeInstanceOf(ApiError),
      );

      expect(result.current).toMatchObject({ user: MAGNUS.user });
      expect(revokeRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('signing in while still launching', () => {
    it('keeps the signed-in account when the launch session arrives later', async () => {
      const launch = deferred<AuthResponse>();
      (getRefreshToken as jest.Mock).mockResolvedValue(null);
      (createGuestSession as jest.Mock).mockReturnValue(launch.promise);
      (signIn as jest.Mock).mockResolvedValue(MAGNUS);
      const { result } = await renderHook(() => useAuthSessionLifecycle());

      await act(() => result.current.signIn(CREDENTIALS));
      await act(async () => launch.resolve(GUEST));

      expect(result.current).toMatchObject({ user: MAGNUS.user });
      expect(revokeRefreshToken).toHaveBeenCalledWith(GUEST.refreshToken);
    });

    it('still finishes launching when that sign-in fails', async () => {
      const launch = deferred<AuthResponse>();
      (getRefreshToken as jest.Mock).mockResolvedValue(null);
      (createGuestSession as jest.Mock).mockReturnValue(launch.promise);
      (signIn as jest.Mock).mockRejectedValue(new ApiError(401, 'nope'));
      const { result } = await renderHook(() => useAuthSessionLifecycle());

      await act(() =>
        expect(result.current.signIn(CREDENTIALS)).rejects.toBeInstanceOf(
          ApiError,
        ),
      );
      await act(async () => launch.resolve(GUEST));

      expect(result.current).toMatchObject({ user: GUEST.user });
    });
  });

  it('reloads the signed-in user, e.g. for ratings after a game', async () => {
    const { result } = await renderSignedInAs(MAGNUS);
    const withNewRating = {
      ...MAGNUS.user,
      ratings: [{ category: 'blitz', rating: 1516, gamesPlayed: 1 }],
    };
    (getMe as jest.Mock).mockResolvedValue(withNewRating);

    await act(() => result.current.reloadUser());

    expect(getMe).toHaveBeenCalledWith(MAGNUS.accessToken);
    expect(result.current).toMatchObject({ user: withNewRating });
  });
});
