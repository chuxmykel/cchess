import { useEffect, useState } from 'react';

import { createGuestSession, GuestSession } from '../network/restClient';
import {
  AppSocket,
  connectSocket,
  waitForServerRejection,
} from '../network/socketClient';
import { clearTokens, getTokens, saveTokens } from '../network/tokenStorage';

const REJECTION_WAIT_MS = 4000;

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
      userId: string;
      socket: AppSocket;
    }
  | { status: typeof AUTH_SESSION_STATUS.ERROR; isReady: false; error: Error };

// If `stored` is set (this session came from SecureStore rather than a
// fresh guest signup) and the server rejects its socket within
// REJECTION_WAIT_MS, mints and persists a brand-new guest session and
// reconnects with it - a stored session can be stale or expired:
// it connects at the transport level but the server then kicks
// it. Only ever retried once, and only for a *stored* session, so a server
// that's genuinely down can't loop here. Returns the given session/socket
// unchanged otherwise.
async function refreshIfRejected(
  stored: GuestSession | null,
  session: GuestSession,
  socket: AppSocket,
): Promise<{ session: GuestSession; socket: AppSocket }> {
  const wasRejected =
    stored && (await waitForServerRejection(socket, REJECTION_WAIT_MS));

  if (!wasRejected) {
    return { session, socket };
  }

  await clearTokens();
  const freshSession = await createGuestSession();
  await saveTokens(freshSession);
  return {
    session: freshSession,
    socket: connectSocket(freshSession.accessToken),
  };
}

export function useAuthSessionBootstrap(): AuthSessionState {
  const [state, setState] = useState<AuthSessionState>({
    status: AUTH_SESSION_STATUS.BOOTSTRAPPING,
    isReady: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const stored = await getTokens();
        let session = stored ?? (await createGuestSession());
        if (!stored) {
          await saveTokens(session);
        }

        let socket = connectSocket(session.accessToken);
        ({ session, socket } = await refreshIfRejected(
          stored,
          session,
          socket,
        ));

        if (!cancelled) {
          setState({
            status: AUTH_SESSION_STATUS.READY,
            isReady: true,
            accessToken: session.accessToken,
            userId: session.userId,
            socket,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: AUTH_SESSION_STATUS.ERROR,
            isReady: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
