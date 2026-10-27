import { AxiosError, create } from 'axios';

import { GameType } from '../domain/types';
import { SERVER_URL } from './env';
import type { GameSnapshot } from './socketEvents';

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
  opponentAvatarColor: string;
  opponentRating: number | null;
  opponentProvisional: boolean;
  ratingDiff: number | null;
  playedAsWhite: boolean;
  createdAt: string;
  endedAt: string | null;
};

export type GamesPage = {
  limit: number;
  /** Only games created before this ISO date. */
  before?: string;
};

export async function getMyGames(
  accessToken: string,
  limit: number,
  before?: string,
): Promise<GameSummary[]> {
  return (
    await apiClient.get<GameSummary[]>('/games', {
      ...bearer(accessToken),
      params: { limit, before },
    })
  ).data;
}

export async function getUserGames(
  username: string,
  page: GamesPage,
  accessToken: string,
): Promise<GameSummary[]> {
  return (
    await apiClient.get<GameSummary[]>(`${userPath(username)}/games`, {
      ...bearer(accessToken),
      params: page,
    })
  ).data;
}

export async function getGame(
  gameId: string,
  accessToken: string,
): Promise<GameSnapshot> {
  return (
    await apiClient.get<GameSnapshot>(
      `/games/${encodeURIComponent(gameId)}`,
      bearer(accessToken),
    )
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

function userPath(username: string): string {
  return `/users/${encodeURIComponent(username)}`;
}

export type Score = { wins: number; draws: number; losses: number };

export type FriendshipStatus =
  'self' | 'none' | 'friends' | 'outgoing' | 'incoming';

export type UserProfile = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarColor: string;
  isGuest: boolean;
  ratings: UserRating[];
  createdAt: string;
  lastSeenAt: string | null;
  online: boolean;
  playingGameId: string | null;
  gamesPlayed: number;
  timePlayedMs: number;
  friendship: { status: FriendshipStatus; requestId: string | null };
  /** Your results against them; null on your own profile. */
  score: Score | null;
};

export type ActivityDay = Score & {
  /** The UTC day, YYYY-MM-DD. */
  date: string;
  category: GameType;
  games: number;
  ratingAfter: number | null;
  ratingDiff: number | null;
};

export type UserSearchResult = {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
};

/** Registered players whose name contains the search, closest first. */
export async function searchUsers(
  search: string,
  accessToken: string,
  limit = 10,
): Promise<UserSearchResult[]> {
  return (
    await apiClient.get<UserSearchResult[]>('/users', {
      ...bearer(accessToken),
      params: { search, limit },
    })
  ).data;
}

export async function getUserProfile(
  username: string,
  accessToken: string,
): Promise<UserProfile> {
  return (
    await apiClient.get<UserProfile>(userPath(username), bearer(accessToken))
  ).data;
}

export async function getUserActivity(
  username: string,
  accessToken: string,
): Promise<ActivityDay[]> {
  return (
    await apiClient.get<ActivityDay[]>(
      `${userPath(username)}/activity`,
      bearer(accessToken),
    )
  ).data;
}

export type Friend = {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  lastSeenAt: string | null;
  online: boolean;
  playingGameId: string | null;
  ratings: UserRating[];
};

export type FriendRequest = {
  id: string;
  user: Friend;
  createdAt: string;
};

export type FriendRequests = {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
};

export async function getFriends(accessToken: string): Promise<Friend[]> {
  return (await apiClient.get<Friend[]>('/friends', bearer(accessToken))).data;
}

export async function getFriendRequests(
  accessToken: string,
): Promise<FriendRequests> {
  return (
    await apiClient.get<FriendRequests>(
      '/friends/requests',
      bearer(accessToken),
    )
  ).data;
}

export async function sendFriendRequest(
  username: string,
  accessToken: string,
): Promise<void> {
  await apiClient.post('/friends/requests', { username }, bearer(accessToken));
}

function friendRequestPath(requestId: string): string {
  return `/friends/requests/${encodeURIComponent(requestId)}`;
}

export async function respondToFriendRequest(
  requestId: string,
  accept: boolean,
  accessToken: string,
): Promise<void> {
  await apiClient.post(
    `${friendRequestPath(requestId)}/${accept ? 'accept' : 'decline'}`,
    undefined,
    bearer(accessToken),
  );
}

export async function cancelFriendRequest(
  requestId: string,
  accessToken: string,
): Promise<void> {
  await apiClient.delete(friendRequestPath(requestId), bearer(accessToken));
}

export async function removeFriend(
  username: string,
  accessToken: string,
): Promise<void> {
  await apiClient.delete(
    `/friends/${encodeURIComponent(username)}`,
    bearer(accessToken),
  );
}

export type ChallengeUser = {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
};

export type Challenge = {
  id: string;
  challenger: ChallengeUser;
  opponent: ChallengeUser;
  minutes: number;
  incrementSeconds: number;
  gameType: GameType;
  rated: boolean;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
  gameId: string | null;
  createdAt: string;
  expiresAt: string;
};

export type Challenges = {
  incoming: Challenge[];
  outgoing: Challenge[];
};

export type NewChallenge = {
  opponentUsername: string;
  minutes: number;
  incrementSeconds: number;
  rated: boolean;
};

export async function getChallenges(accessToken: string): Promise<Challenges> {
  return (await apiClient.get<Challenges>('/challenges', bearer(accessToken)))
    .data;
}

export async function createChallenge(
  challenge: NewChallenge,
  accessToken: string,
): Promise<Challenge> {
  return (
    await apiClient.post<Challenge>(
      '/challenges',
      challenge,
      bearer(accessToken),
    )
  ).data;
}

function challengePath(challengeId: string): string {
  return `/challenges/${encodeURIComponent(challengeId)}`;
}

export async function acceptChallenge(
  challengeId: string,
  accessToken: string,
): Promise<GameSnapshot> {
  return (
    await apiClient.post<GameSnapshot>(
      `${challengePath(challengeId)}/accept`,
      undefined,
      bearer(accessToken),
    )
  ).data;
}

export async function declineChallenge(
  challengeId: string,
  accessToken: string,
): Promise<void> {
  await apiClient.post(
    `${challengePath(challengeId)}/decline`,
    undefined,
    bearer(accessToken),
  );
}

export async function cancelChallenge(
  challengeId: string,
  accessToken: string,
): Promise<void> {
  await apiClient.post(
    `${challengePath(challengeId)}/cancel`,
    undefined,
    bearer(accessToken),
  );
}

export type DirectMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  createdAt: string;
};

export type UnreadCount = { userId: string; count: number };

function messagesPath(username: string): string {
  return `/messages/${encodeURIComponent(username)}`;
}

/** Newest first; `before` pages back through older ones. */
export async function getMessages(
  username: string,
  page: { limit: number; before?: string },
  accessToken: string,
): Promise<DirectMessage[]> {
  return (
    await apiClient.get<DirectMessage[]>(messagesPath(username), {
      ...bearer(accessToken),
      params: page,
    })
  ).data;
}

export async function sendMessage(
  username: string,
  text: string,
  accessToken: string,
): Promise<DirectMessage> {
  return (
    await apiClient.post<DirectMessage>(
      messagesPath(username),
      { text },
      bearer(accessToken),
    )
  ).data;
}

export async function markMessagesRead(
  username: string,
  accessToken: string,
): Promise<void> {
  await apiClient.post(
    `${messagesPath(username)}/read`,
    undefined,
    bearer(accessToken),
  );
}

export async function clearMessages(
  username: string,
  accessToken: string,
): Promise<void> {
  await apiClient.delete(messagesPath(username), bearer(accessToken));
}

export async function getUnreadMessageCounts(
  accessToken: string,
): Promise<UnreadCount[]> {
  return (
    await apiClient.get<UnreadCount[]>('/messages/unread', bearer(accessToken))
  ).data;
}
