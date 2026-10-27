import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { accessTokenExpiresAt } from '../network/accessToken';
import {
  AccountUser,
  ApiError,
  AuthResponse,
  createGuestSession,
  getMe,
  NewAccount,
  refreshSession,
  register as registerAccount,
  revokeRefreshToken,
  signIn as signInToAccount,
  SignInCredentials,
} from '../network/restClient';
import {
  AppSocket,
  connectSocket,
  updateSocketToken,
} from '../network/socketClient';
import { getRefreshToken, saveRefreshToken } from '../network/tokenStorage';

export const AUTH_SESSION_STATUS = {
  BOOTSTRAPPING: 'bootstrapping',
  READY: 'ready',
  ERROR: 'error',
} as const;

export type AuthSessionState =
  | { status: typeof AUTH_SESSION_STATUS.BOOTSTRAPPING; isReady: false }
  | {
      status: typeof AUTH_SESSION_STATUS.READY;
      isReady: true;
      user: AccountUser;
      socket: AppSocket;
    }
  | { status: typeof AUTH_SESSION_STATUS.ERROR; isReady: false; error: Error };

export type AuthorizedRequest = <T>(
  request: (accessToken: string) => Promise<T>,
) => Promise<T>;

export type AuthSessionActions = {
  signIn: (credentials: SignInCredentials) => Promise<void>;
  register: (account: NewAccount) => Promise<void>;
  signOut: () => Promise<void>;
  reloadUser: () => Promise<void>;
  authorized: AuthorizedRequest;
};

export type AuthSession = AuthSessionState & AuthSessionActions;

const UNAUTHORIZED = 401;
const SERVER_KICK = 'io server disconnect';
const REFRESH_BEFORE_EXPIRY_MS = 60_000;

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === UNAUTHORIZED;
}

function expiresSoon(accessToken: string): boolean {
  const expiresAt = accessTokenExpiresAt(accessToken);
  return (
    expiresAt !== null && expiresAt - Date.now() < REFRESH_BEFORE_EXPIRY_MS
  );
}

async function resumeStoredSessionOrStartAsGuest(): Promise<AuthResponse> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    try {
      return await refreshSession(refreshToken);
    } catch (error) {
      if (!isUnauthorized(error)) {
        throw error;
      }
    }
  }
  return createGuestSession();
}

function revokeQuietly(refreshToken: string): void {
  revokeRefreshToken(refreshToken).catch(() => {});
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function useAuthSessionLifecycle(): AuthSession {
  const [state, setState] = useState<AuthSessionState>({
    status: AUTH_SESSION_STATUS.BOOTSTRAPPING,
    isReady: false,
  });
  const adoptedSession = useRef<AuthResponse | null>(null);
  const lastIssuedRequestId = useRef(0);
  const adoptedRequestId = useRef(0);
  const hasStartedBootstrap = useRef(false);
  const isMounted = useRef(false);
  const refreshInFlight = useRef<Promise<AuthResponse> | null>(null);

  const issueRequestId = useCallback(() => {
    lastIssuedRequestId.current += 1;
    return lastIssuedRequestId.current;
  }, []);

  const refreshAccess = useCallback(async (): Promise<AuthResponse> => {
    const sessionToRefresh = adoptedSession.current;
    if (!sessionToRefresh) {
      throw new Error('There is no session to refresh');
    }
    if (!refreshInFlight.current) {
      const refreshedForRequestId = adoptedRequestId.current;
      refreshInFlight.current = refreshSession(sessionToRefresh.refreshToken)
        .then(async (refreshed) => {
          if (
            !isMounted.current ||
            adoptedRequestId.current !== refreshedForRequestId
          ) {
            revokeQuietly(refreshed.refreshToken);
            return adoptedSession.current ?? refreshed;
          }
          adoptedSession.current = refreshed;
          await saveRefreshToken(refreshed.refreshToken);
          updateSocketToken(refreshed.accessToken);
          setState((current) =>
            current.isReady ? { ...current, user: refreshed.user } : current,
          );
          return refreshed;
        })
        .finally(() => {
          refreshInFlight.current = null;
        });
    }
    return refreshInFlight.current;
  }, []);

  const watchForServerKicks = useCallback(
    (socket: AppSocket) => {
      let hasRetriedSinceConnecting = false;
      socket.on('connect', () => {
        hasRetriedSinceConnecting = false;
      });
      socket.on('disconnect', (reason) => {
        if (
          reason !== SERVER_KICK ||
          hasRetriedSinceConnecting ||
          adoptedSession.current === null
        ) {
          return;
        }
        hasRetriedSinceConnecting = true;
        refreshAccess()
          .then(() => socket.connect())
          .catch(() => {});
      });
    },
    [refreshAccess],
  );

  const adoptIfNewest = useCallback(
    async (requestId: number, response: AuthResponse) => {
      if (!isMounted.current || requestId < adoptedRequestId.current) {
        revokeQuietly(response.refreshToken);
        return;
      }
      const replacedSession = adoptedSession.current;
      adoptedRequestId.current = requestId;
      adoptedSession.current = response;
      await saveRefreshToken(response.refreshToken);
      const socket = connectSocket(response.accessToken);
      watchForServerKicks(socket);
      setState({
        status: AUTH_SESSION_STATUS.READY,
        isReady: true,
        user: response.user,
        socket,
      });
      if (replacedSession) {
        revokeQuietly(replacedSession.refreshToken);
      }
    },
    [watchForServerKicks],
  );

  useEffect(() => {
    isMounted.current = true;
    if (!hasStartedBootstrap.current) {
      hasStartedBootstrap.current = true;
      const requestId = issueRequestId();
      resumeStoredSessionOrStartAsGuest()
        .then((response) => adoptIfNewest(requestId, response))
        .catch((error) => {
          if (isMounted.current && !adoptedSession.current) {
            setState({
              status: AUTH_SESSION_STATUS.ERROR,
              isReady: false,
              error: asError(error),
            });
          }
        });
    }
    return () => {
      isMounted.current = false;
    };
  }, [issueRequestId, adoptIfNewest]);

  const switchTo = useCallback(
    async (requestSession: () => Promise<AuthResponse>) => {
      const requestId = issueRequestId();
      await adoptIfNewest(requestId, await requestSession());
    },
    [issueRequestId, adoptIfNewest],
  );

  const refreshOrStartAsGuest = useCallback(async () => {
    try {
      return await refreshAccess();
    } catch (error) {
      if (isUnauthorized(error)) {
        await switchTo(createGuestSession);
      }
      throw error;
    }
  }, [refreshAccess, switchTo]);

  const authorized = useCallback<AuthorizedRequest>(
    async (request) => {
      let session = adoptedSession.current;
      if (!session) {
        throw new Error('There is no session to authorize with');
      }
      if (expiresSoon(session.accessToken)) {
        session = await refreshOrStartAsGuest();
      }
      try {
        return await request(session.accessToken);
      } catch (error) {
        if (!isUnauthorized(error)) {
          throw error;
        }
        session = await refreshOrStartAsGuest();
        return request(session.accessToken);
      }
    },
    [refreshOrStartAsGuest],
  );

  const signIn = useCallback(
    (credentials: SignInCredentials) =>
      switchTo(() => signInToAccount(credentials)),
    [switchTo],
  );

  const register = useCallback(
    (account: NewAccount) => switchTo(() => registerAccount(account)),
    [switchTo],
  );

  const signOut = useCallback(() => switchTo(createGuestSession), [switchTo]);

  const reloadUser = useCallback(async () => {
    const userId = adoptedSession.current?.user.id;
    const user = await authorized(getMe);
    setState((current) =>
      current.isReady && current.user.id === userId
        ? { ...current, user }
        : current,
    );
  }, [authorized]);

  return useMemo(
    () => ({ ...state, signIn, register, signOut, reloadUser, authorized }),
    [state, signIn, register, signOut, reloadUser, authorized],
  );
}
