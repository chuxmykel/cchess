import {
  AUTH_SESSION_STATUS,
  AuthSession,
  AuthSessionActions,
} from '../hooks/useAuthSessionLifecycle';
import { AccountUser } from '../network/restClient';
import { AppSocket } from '../network/socketClient';

export function makeAccountUser(
  overrides: Partial<AccountUser> = {},
): AccountUser {
  return {
    id: 'user-1',
    username: 'guest_1234',
    displayName: 'Guest 1234',
    avatarColor: '#3b82f6',
    isGuest: true,
    ratings: [],
    ...overrides,
  };
}

function makeActions(accessToken: string | null): AuthSessionActions {
  return {
    authorized: jest.fn((request) =>
      accessToken === null
        ? Promise.reject(new Error('There is no session to authorize with'))
        : request(accessToken),
    ),
    signIn: jest.fn().mockResolvedValue(undefined),
    register: jest.fn().mockResolvedValue(undefined),
    signOut: jest.fn().mockResolvedValue(undefined),
    reloadUser: jest.fn().mockResolvedValue(undefined),
  };
}

export function makeAuthSession({
  user = {},
  socket = {} as AppSocket,
  accessToken = 'access-token',
}: {
  user?: Partial<AccountUser>;
  socket?: AppSocket;
  accessToken?: string;
} = {}): AuthSession {
  return {
    status: AUTH_SESSION_STATUS.READY,
    isReady: true,
    user: makeAccountUser(user),
    socket,
    ...makeActions(accessToken),
  };
}

export function makeBootstrappingAuthSession(): AuthSession {
  return {
    status: AUTH_SESSION_STATUS.BOOTSTRAPPING,
    isReady: false,
    ...makeActions(null),
  };
}
