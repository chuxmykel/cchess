import { AxiosError, create } from 'axios';

import { GameType } from '../domain/types';
import { SERVER_URL } from './env';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type ServerErrorBody = { message?: string | string[] };

function readableErrorMessage(error: AxiosError<ServerErrorBody>): string {
  const message = error.response?.data?.message;
  if (Array.isArray(message)) {
    return message.join('\n');
  }
  return message || error.message;
}

export const apiClient = create({ baseURL: SERVER_URL });

apiClient.interceptors.response.use(undefined, (error: AxiosError) =>
  Promise.reject(
    new ApiError(error.response?.status ?? 0, readableErrorMessage(error)),
  ),
);

function bearer(accessToken: string) {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}

export type UserRating = {
  category: GameType;
  rating: number;
  gamesPlayed: number;
  provisional: boolean;
};

export type AccountUser = {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  isGuest: boolean;
  ratings: UserRating[];
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AccountUser;
};

export type SignInCredentials = {
  usernameOrEmail: string;
  password: string;
};

export type NewAccount = {
  username: string;
  email: string;
  password: string;
};

export async function createGuestSession(): Promise<AuthResponse> {
  return (await apiClient.post<AuthResponse>('/auth/guest')).data;
}

export async function signIn(
  credentials: SignInCredentials,
): Promise<AuthResponse> {
  return (await apiClient.post<AuthResponse>('/auth/login', credentials)).data;
}

export async function register(account: NewAccount): Promise<AuthResponse> {
  return (await apiClient.post<AuthResponse>('/auth/register', account)).data;
}

export async function refreshSession(
  refreshToken: string,
): Promise<AuthResponse> {
  return (await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }))
    .data;
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}

const NOT_FOUND = 404;

export async function isUsernameAvailable(
  username: string,
  accessToken: string,
): Promise<boolean> {
  try {
    await apiClient.get(
      `/users/${encodeURIComponent(username)}`,
      bearer(accessToken),
    );
    return false;
  } catch (error) {
    if (error instanceof ApiError && error.status === NOT_FOUND) {
      return true;
    }
    throw error;
  }
}

export async function getMe(accessToken: string): Promise<AccountUser> {
  return (await apiClient.get<AccountUser>('/users/me', bearer(accessToken)))
    .data;
}

export type GameHistoryResult = 'win' | 'loss' | 'draw' | null;

export type GameSummary = {
  id: string;
  gameType: GameType;
  minutes: number;
  incrementSeconds: number;
  rated: boolean;
  status: 'active' | 'completed' | 'aborted';
  result: GameHistoryResult;
  opponentUsername: string;
  opponentDisplayName: string;
  opponentRating: number | null;
  opponentProvisional: boolean;
  ratingDiff: number | null;
  playedAsWhite: boolean;
  createdAt: string;
  endedAt: string | null;
};

export async function getMyGames(
  accessToken: string,
  limit: number,
): Promise<GameSummary[]> {
  return (
    await apiClient.get<GameSummary[]>('/games', {
      ...bearer(accessToken),
      params: { limit },
    })
  ).data;
}

export async function getGamePgn(
  gameId: string,
  accessToken: string,
): Promise<string> {
  return (
    await apiClient.get<string>(`/games/${encodeURIComponent(gameId)}/pgn`, {
      ...bearer(accessToken),
      responseType: 'text',
    })
  ).data;
}

type BookmarkState = { bookmarked: boolean };

function bookmarkPath(gameId: string): string {
  return `/games/${encodeURIComponent(gameId)}/bookmark`;
}

export async function isGameBookmarked(
  gameId: string,
  accessToken: string,
): Promise<boolean> {
  return (
    await apiClient.get<BookmarkState>(
      bookmarkPath(gameId),
      bearer(accessToken),
    )
  ).data.bookmarked;
}

export async function setGameBookmarked(
  gameId: string,
  bookmarked: boolean,
  accessToken: string,
): Promise<boolean> {
  const response = bookmarked
    ? await apiClient.put<BookmarkState>(
        bookmarkPath(gameId),
        undefined,
        bearer(accessToken),
      )
    : await apiClient.delete<BookmarkState>(
        bookmarkPath(gameId),
        bearer(accessToken),
      );
  return response.data.bookmarked;
}
