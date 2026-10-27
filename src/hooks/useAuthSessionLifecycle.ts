import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
import { AppSocket, connectSocket } from '../network/socketClient';
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
      accessToken: string;
      user: AccountUser;
      socket: AppSocket;
    }
  | { status: typeof AUTH_SESSION_STATUS.ERROR; isReady: false; error: Error };

export type AuthSessionActions = {
  signIn: (credentials: SignInCredentials) => Promise<void>;
  register: (account: NewAccount) => Promise<void>;
  signOut: () => Promise<void>;
  reloadUser: () => Promise<void>;
};

export type AuthSession = AuthSessionState & AuthSessionActions;

const UNAUTHORIZED = 401;

function isRejectedRefreshToken(error: unknown): boolean {
  return error instanceof ApiError && error.status === UNAUTHORIZED;
}

async function resumeStoredSessionOrStartAsGuest(): Promise<AuthResponse> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    try {
      return await refreshSession(refreshToken);
    } catch (error) {
      if (!isRejectedRefreshToken(error)) {
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

  const issueRequestId = useCallback(() => {
    lastIssuedRequestId.current += 1;
    return lastIssuedRequestId.current;
  }, []);

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
      setState({
        status: AUTH_SESSION_STATUS.READY,
        isReady: true,
        accessToken: response.accessToken,
        user: response.user,
        socket: connectSocket(response.accessToken),
      });
      if (replacedSession) {
        revokeQuietly(replacedSession.refreshToken);
      }
    },
    [],
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
    const session = adoptedSession.current;
    if (!session) {
      return;
    }
    const user = await getMe(session.accessToken);
    setState((current) =>
      current.isReady && current.accessToken === session.accessToken
        ? { ...current, user }
        : current,
    );
  }, []);

  return useMemo(
    () => ({ ...state, signIn, register, signOut, reloadUser }),
    [state, signIn, register, signOut, reloadUser],
  );
}
