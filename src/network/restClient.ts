import { AxiosError, create } from 'axios';
import type { Color, Square } from 'chess.js';

import type { LichessRating, LichessSpeed } from '../constants/explorer';
import type { ReviewDigests, SideDigest } from '../domain/review/digest';
import type { Badge, GameBadgeKind } from '../domain/badges';
import type { PositionEval } from '../domain/review/types';
import { GameType } from '../domain/types';
import { SERVER_URL } from './env';
import type {
  ColorChoice,
  GameSnapshot,
  MaintenanceStatus,
  RatingRange,
} from './socketEvents';

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
  /** The account's email - null for a guest. Like the fields after it,
   * absent from a server older than account emails. */
  email?: string | null;
  /** Whether the email has been confirmed by its link. */
  emailVerified?: boolean;
  /** Whether they chat in games with players who aren't friends. */
  chatWithStrangers?: boolean;
  /** Whether they've accepted the terms in force - false for a guest, and
   * once the terms change. */
  termsAccepted?: boolean;
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
  /** The terms of use accepted - the server refuses a sign-up without. */
  acceptTerms: true;
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
  initialSeconds: number;
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
  // Each side's accuracy, yours first, once the game has been reviewed.
  accuracy: number | null;
  opponentAccuracy: number | null;
  createdAt: string;
  endedAt: string | null;
};

// A history lists games played to an end: one in progress, a daily game
// say, would take a place in the page and push a finished one out. (Aborted
// games are left out of a history unless asked for.)
const FINISHED = 'completed';

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
      params: { limit, before, status: FINISHED },
    })
  ).data;
}

/** The live game you're in the middle of, if any - not a daily one, of
 * which you may have many, played whenever. */
export async function getMyActiveGame(
  accessToken: string,
): Promise<GameSummary | null> {
  const games = (
    await apiClient.get<GameSummary[]>('/games', {
      ...bearer(accessToken),
      params: { status: 'active', kind: 'live', limit: 1 },
    })
  ).data;
  return games[0] ?? null;
}

export type DailyGameOpponent = {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
};

/** A daily game in progress, as your list of them shows it. */
export type DailyGame = {
  id: string;
  fen: string;
  turn: Color;
  lastMove: { from: Square; to: Square } | null;
  playedAsWhite: boolean;
  myTurn: boolean;
  daysPerMove: number;
  /** When the side to move runs out of time. */
  moveDeadlineAt: string;
  rated: boolean;
  opponent: DailyGameOpponent;
};

/** A daily game sought: matched at once with a seek already waiting that
 * agrees, or left waiting - however long - for one that will. */
export type NewDailySeek = {
  days: number;
  rated: boolean;
  ratingRange: RatingRange;
  color: ColorChoice;
};

export type DailySeek = {
  id: string;
  days: number;
  rated: boolean;
  ratingRange: RatingRange | null;
  color: ColorChoice;
  createdAt: string;
};

export type DailySeekResult =
  | { status: 'queued'; seek: DailySeek }
  | { status: 'matched'; game: GameSnapshot };

export async function createDailySeek(
  seek: NewDailySeek,
  accessToken: string,
): Promise<DailySeekResult> {
  return (
    await apiClient.post<DailySeekResult>(
      '/daily-seeks',
      seek,
      bearer(accessToken),
    )
  ).data;
}

/** Your daily seeks still waiting, oldest first. */
export async function getMyDailySeeks(
  accessToken: string,
): Promise<DailySeek[]> {
  return (await apiClient.get<DailySeek[]>('/daily-seeks', bearer(accessToken)))
    .data;
}

export async function cancelDailySeek(
  seekId: string,
  accessToken: string,
): Promise<void> {
  await apiClient.delete(
    `/daily-seeks/${encodeURIComponent(seekId)}`,
    bearer(accessToken),
  );
}

/** A move played from a position, and how those games ended. */
export type ExplorerMove = {
  san: string;
  uci: string;
  games: number;
  whiteWins: number;
  draws: number;
  blackWins: number;
};

/** Where an answer came from: the database asked, or - lichess out of
 * reach - `cchess`, the games played here. */
export type ExplorerSource = 'masters' | 'lichess' | 'player' | 'cchess';

export type ExplorerPosition = {
  source: ExplorerSource;
  /** Lichess's answer as the server kept it over 30 days ago - a fresh one
   * is on its way. */
  stale: boolean;
  /** Games that reached the position and went on, and how they ended. */
  totalGames: number;
  whiteWins: number;
  draws: number;
  blackWins: number;
  /** The most played first. */
  moves: ExplorerMove[];
};

/** Which games the explorer looks in - with none, the games finished
 * here. */
export type ExplorerQuery =
  | { db: 'masters' }
  | { db: 'lichess'; speeds: LichessSpeed[]; ratings: LichessRating[] }
  | { db: 'player'; user: string; color: 'white' | 'black' };

/** The opening explorer: lichess's Masters or Lichess database, one
 * player's games here, or everyone's - finished games only. */
export async function getExplorer(
  fen: string,
  accessToken: string,
  query?: ExplorerQuery,
): Promise<ExplorerPosition> {
  const params =
    query?.db === 'lichess'
      ? {
          db: query.db,
          speeds: query.speeds.join(','),
          ratings: query.ratings.join(','),
        }
      : query;
  return (
    await apiClient.get<ExplorerPosition>('/explorer', {
      ...bearer(accessToken),
      params: { fen, ...params },
    })
  ).data;
}

/** Your conditional moves in a daily game: each line the opponent's move,
 * your reply, theirs... in UCI, from the game's position after `basePly`
 * moves - null, with no lines, when there are none. */
export type ConditionalLines = { basePly: number | null; lines: string[][] };

function conditionalMovesPath(gameId: string): string {
  return `/games/${encodeURIComponent(gameId)}/conditional-moves`;
}

export async function getConditionalMoves(
  gameId: string,
  accessToken: string,
): Promise<ConditionalLines> {
  return (
    await apiClient.get<ConditionalLines>(
      conditionalMovesPath(gameId),
      bearer(accessToken),
    )
  ).data;
}

/** Saves lines, from the game's position after `basePly` moves - the
 * opponent to move - in place of any saved; none clears them. */
export async function saveConditionalMoves(
  gameId: string,
  basePly: number,
  lines: string[][],
  accessToken: string,
): Promise<ConditionalLines> {
  return (
    await apiClient.put<ConditionalLines>(
      conditionalMovesPath(gameId),
      { basePly, lines },
      bearer(accessToken),
    )
  ).data;
}

/** Your own notes on a game, seen by nobody else. */
export type GameNotes = { body: string; updatedAt: string | null };

export async function getGameNotes(
  gameId: string,
  accessToken: string,
): Promise<GameNotes> {
  return (
    await apiClient.get<GameNotes>(
      `/games/${encodeURIComponent(gameId)}/notes`,
      bearer(accessToken),
    )
  ).data;
}

/** Replaces your notes on a game; none clears them. */
export async function saveGameNotes(
  gameId: string,
  body: string,
  accessToken: string,
): Promise<GameNotes> {
  return (
    await apiClient.put<GameNotes>(
      `/games/${encodeURIComponent(gameId)}/notes`,
      { body },
      bearer(accessToken),
    )
  ).data;
}

/** A finished game's review as the server keeps it: the engine's evals of
 * every position, the start first, worked out on a player's device. */
export type StoredGameReview = {
  gameId: string;
  engine: string;
  depth: number;
  whiteAccuracy: number;
  blackAccuracy: number;
  evals: PositionEval[];
  /** Each side's review boiled down - none until the app's sent them. */
  digests?: ReviewDigests | null;
  /** The badges the game earned each side, its review's included. */
  badges?: Record<Color, GameBadgeKind[]>;
  createdAt: string;
};

/** A game's review, or null when nobody has reviewed it yet. */
/** Maintenance announced on the server, if any - no sign-in needed. */
export async function getMaintenance(): Promise<MaintenanceStatus> {
  return (await apiClient.get<MaintenanceStatus>('/maintenance')).data;
}

export async function getGameReview(
  gameId: string,
  accessToken: string,
): Promise<StoredGameReview | null> {
  try {
    return (
      await apiClient.get<StoredGameReview>(
        `/games/${encodeURIComponent(gameId)}/review`,
        bearer(accessToken),
      )
    ).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** Keeps a review for everyone - unless one searched as deep is kept
 * already, which comes back instead. */
export async function saveGameReview(
  gameId: string,
  review: Omit<StoredGameReview, 'gameId' | 'createdAt' | 'badges'> & {
    /** Each move's class and what it did, for the server's badges. */
    moveClasses?: { moveClass: string; facts: string[] }[];
  },
  accessToken: string,
): Promise<StoredGameReview> {
  return (
    await apiClient.put<StoredGameReview>(
      `/games/${encodeURIComponent(gameId)}/review`,
      review,
      bearer(accessToken),
    )
  ).data;
}

/** Your daily games in progress: those on your move first, then each by
 * when its move runs out. */
export async function getDailyGames(
  accessToken: string,
  limit?: number,
): Promise<DailyGame[]> {
  return (
    await apiClient.get<DailyGame[]>('/games/daily', {
      ...bearer(accessToken),
      params: { limit },
    })
  ).data;
}

/** How many finished games ended one way, in one game type, for the
 * player whose games they are - one for each pair they've played. */
export type GameCount = {
  result: 'win' | 'draw' | 'loss';
  gameType: GameType;
  count: number;
};

export async function getMyGameCounts(
  accessToken: string,
): Promise<GameCount[]> {
  return (
    await apiClient.get<GameCount[]>('/games/counts', bearer(accessToken))
  ).data;
}

export async function getUserGameCounts(
  username: string,
  accessToken: string,
): Promise<GameCount[]> {
  return (
    await apiClient.get<GameCount[]>(
      `${userPath(username)}/games/counts`,
      bearer(accessToken),
    )
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
      params: { ...page, status: FINISHED },
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
  /** A computer opponent - a house bot. */
  isBot?: boolean;
  ratings: UserRating[];
  createdAt: string;
  lastSeenAt: string | null;
  online: boolean;
  playingGameId: string | null;
  gamesPlayed: number;
  timePlayedMs: number;
  friendsCount: number;
  friendship: { status: FriendshipStatus; requestId: string | null };
  /** Your results against them; null on your own profile. */
  score: Score | null;
  /** Whether you've blocked them. */
  blockedByYou?: boolean;
  /** Their puzzle rating; null until they've tried a pool puzzle. */
  puzzleRating?: {
    rating: number;
    attempts: number;
    provisional: boolean;
  } | null;
};

export type ActivityDay = Score & {
  /** The UTC day, YYYY-MM-DD. */
  date: string;
  category: GameType;
  games: number;
  ratingAfter: number | null;
  ratingDiff: number | null;
};

export const RATING_PERIODS = ['1w', '1m', '3m', '1y', 'all'] as const;
export type RatingPeriod = (typeof RATING_PERIODS)[number];

export type RatingPoint = { at: string; rating: number };

export type NotableGame = {
  gameId: string;
  opponentUsername: string;
  opponentDisplayName: string;
  /** The opponent's rating when the game started. */
  opponentRating: number;
  endedAt: string;
};

/** One category's rating and results over a period. */
export type RatingStats = Score & {
  period: RatingPeriod;
  /** The rating right now. */
  rating: UserRating;
  /** The rating going into the period's first rated game, then after each
   * rated game, oldest first. */
  history: RatingPoint[];
  highest: RatingPoint | null;
  lowest: RatingPoint | null;
  /** Points gained over the period, negative when lost. */
  ratingChange: number | null;
  /** Finished games, rated and casual. */
  games: number;
  timePlayedMs: number;
  bestWin: NotableGame | null;
  worstLoss: NotableGame | null;
  longestWinStreak: number;
  longestLosingStreak: number;
};

export type UserSearchResult = {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  isBot?: boolean;
};

/** Registered players whose name contains the search, closest first. */
/** Players matching the search, closest first; `offset` skips that many,
 * for the next page. */
export async function searchUsers(
  search: string,
  accessToken: string,
  page: { limit: number; offset: number } = { limit: 20, offset: 0 },
): Promise<UserSearchResult[]> {
  return (
    await apiClient.get<UserSearchResult[]>('/users', {
      ...bearer(accessToken),
      params: { search, ...page },
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

/** A player's friends, the most recently added first. */
export async function getUserFriends(
  username: string,
  accessToken: string,
): Promise<UserFriend[]> {
  return (
    await apiClient.get<UserFriend[]>(
      `${userPath(username)}/friends`,
      bearer(accessToken),
    )
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

/** A player's puzzle rating and their tries at pool puzzles over a period. */
export type PuzzleStats = {
  period: RatingPeriod;
  /** The puzzle rating right now. */
  rating: { rating: number; attempts: number; provisional: boolean };
  /** The rating going into the period's first try, then each day's
   * closing rating, oldest first. */
  history: RatingPoint[];
  highest: RatingPoint | null;
  lowest: RatingPoint | null;
  /** Points gained over the period, negative when lost. */
  ratingChange: number | null;
  attempts: number;
  solved: number;
  missed: number;
  /** The highest-rated puzzle solved. */
  bestSolve: { puzzleId: string; rating: number; at: string } | null;
  longestSolvedStreak: number;
  longestMissedStreak: number;
  /** Each theme tried - lichess's names - the most tried first. */
  themes: { theme: string; attempts: number; solved: number }[];
};

export async function getPuzzleStats(
  username: string,
  period: RatingPeriod,
  accessToken: string,
): Promise<PuzzleStats> {
  return (
    await apiClient.get<PuzzleStats>(`${userPath(username)}/puzzles/stats`, {
      ...bearer(accessToken),
      params: { period },
    })
  ).data;
}

export async function getRatingStats(
  username: string,
  category: GameType,
  period: RatingPeriod,
  accessToken: string,
): Promise<RatingStats> {
  return (
    await apiClient.get<RatingStats>(
      `${userPath(username)}/ratings/${category}`,
      { ...bearer(accessToken), params: { period } },
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

/** Someone's friend, as their profile lists them. */
export type UserFriend = Friend & {
  /** When they became friends. */
  friendsSince: string;
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
  initialSeconds: number;
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
  initialSeconds: number;
  incrementSeconds: number;
  rated: boolean;
  /** The color the challenger plays; random when left out. */
  color?: ColorChoice;
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

/** A game or a position sent with a message, drawn as a card. */
export type MessageAttachment =
  { kind: 'game'; gameId: string } | { kind: 'position'; fen: string };

export type DirectMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  /** Empty when the message is only its attachment. */
  text: string;
  attachment: MessageAttachment | null;
  createdAt: string;
};

/** One person you have messages with, for the inbox. */
export type ConversationSummary = {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarColor: string;
  };
  /** The newest message since you last cleared them. */
  lastMessage: DirectMessage;
  /** Theirs you haven't read. */
  unreadCount: number;
  /** When they last read yours - null until they have. */
  theirLastReadAt: string | null;
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

/** Sends `text` - which may be empty with an attachment. */
export async function sendMessage(
  username: string,
  message: { text: string; attachment?: MessageAttachment },
  accessToken: string,
): Promise<DirectMessage> {
  return (
    await apiClient.post<DirectMessage>(
      messagesPath(username),
      message,
      bearer(accessToken),
    )
  ).data;
}

/** Your conversations, the newest message first; `before` (the last one's
 * `lastMessage.createdAt`) pages on. */
export async function getConversations(
  page: { limit: number; before?: string },
  accessToken: string,
): Promise<ConversationSummary[]> {
  return (
    await apiClient.get<ConversationSummary[]>('/messages', {
      ...bearer(accessToken),
      params: page,
    })
  ).data;
}

/** When `username` last read your messages - null until they have. */
export async function getTheirLastReadAt(
  username: string,
  accessToken: string,
): Promise<string | null> {
  return (
    await apiClient.get<{ theirLastReadAt: string | null }>(
      `${messagesPath(username)}/seen`,
      bearer(accessToken),
    )
  ).data.theirLastReadAt;
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

// Account and safety: email, passwords, deletion, blocks, reports, the
// terms, and what the server says about the app itself.

/** What the app reads on launch, signed out or in. */
export type AppConfig = {
  /** The oldest app version the server works with - older ones update. */
  minimumVersion: string;
  termsVersion: string;
  privacyVersion: string;
  supportEmail: string;
  termsUrl: string;
  privacyUrl: string;
  deleteAccountUrl: string;
};

export async function getAppConfig(): Promise<AppConfig> {
  return (await apiClient.get<AppConfig>('/app/config')).data;
}

/** Deletes the signed-in account - its password confirming it. */
export async function deleteAccount(
  password: string,
  accessToken: string,
): Promise<void> {
  await apiClient.delete('/users/me', {
    ...bearer(accessToken),
    data: { password },
  });
}

export async function acceptTerms(accessToken: string): Promise<void> {
  await apiClient.post('/users/me/terms', undefined, bearer(accessToken));
}

export async function setChatWithStrangers(
  chatWithStrangers: boolean,
  accessToken: string,
): Promise<AccountUser> {
  return (
    await apiClient.patch<AccountUser>(
      '/users/me',
      { chatWithStrangers },
      bearer(accessToken),
    )
  ).data;
}

/** Emails a new link to confirm the account's address. */
export async function resendVerificationEmail(
  accessToken: string,
): Promise<void> {
  await apiClient.post(
    '/auth/email/verification',
    undefined,
    bearer(accessToken),
  );
}

/** Emails a link to the new address; it changes once that's used. */
export async function requestEmailChange(
  email: string,
  password: string,
  accessToken: string,
): Promise<void> {
  await apiClient.post(
    '/auth/email/change',
    { email, password },
    bearer(accessToken),
  );
}

/** Uses a link from an email - confirming the address, or a new one. */
export async function verifyEmail(token: string): Promise<{ email: string }> {
  return (
    await apiClient.post<{ email: string }>('/auth/email/verify', { token })
  ).data;
}

/** Emails a reset link if the address has an account - the server never
 * says whether it does. */
export async function requestPasswordReset(email: string): Promise<void> {
  await apiClient.post('/auth/password/forgot', { email });
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<void> {
  await apiClient.post('/auth/password/reset', { token, password });
}

export type BlockedUser = {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  blockedAt: string;
};

export async function getBlockedUsers(
  accessToken: string,
): Promise<BlockedUser[]> {
  return (
    await apiClient.get<BlockedUser[]>('/users/me/blocks', bearer(accessToken))
  ).data;
}

function blockPath(username: string): string {
  return `/users/${encodeURIComponent(username)}/block`;
}

export async function blockUser(
  username: string,
  accessToken: string,
): Promise<void> {
  await apiClient.post(blockPath(username), undefined, bearer(accessToken));
}

export async function unblockUser(
  username: string,
  accessToken: string,
): Promise<void> {
  await apiClient.delete(blockPath(username), bearer(accessToken));
}

export const REPORT_REASONS = [
  'abuse',
  'hate',
  'sexual',
  'spam',
  'cheating',
  'username',
  'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export type NewReport = {
  username: string;
  reason: ReportReason;
  details?: string;
  /** The game - for a message in its chat, or the game itself. */
  gameId?: string;
  /** The message reported: in gameId's chat, or else a direct message. */
  messageId?: string;
};

export async function reportUser(
  report: NewReport,
  accessToken: string,
): Promise<void> {
  await apiClient.post('/reports', report, bearer(accessToken));
}

/** Your reviewed games' digests over a period, newest first - to you
 * alone: anyone else's come back empty. */
export type PlayerPatterns = {
  games: {
    gameId: string;
    color: Color;
    endedAt: string | null;
    digest: SideDigest;
  }[];
};

export async function getPatterns(
  username: string,
  period: RatingPeriod,
  accessToken: string,
): Promise<PlayerPatterns> {
  return (
    await apiClient.get<PlayerPatterns>(
      `/users/${encodeURIComponent(username)}/patterns`,
      { ...bearer(accessToken), params: { period } },
    )
  ).data;
}

/** A player's badges, the newest first, each with the game that earned
 * it. */
export async function getBadges(
  username: string,
  accessToken: string,
): Promise<Badge[]> {
  return (
    await apiClient.get<Badge[]>(
      `/users/${encodeURIComponent(username)}/badges`,
      bearer(accessToken),
    )
  ).data;
}

/** A puzzle from the pool - lichess's: `fen` before the opponent's move,
 * `moves` that move and then the solution. */
export type PoolPuzzle = {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  themes: string[];
};

export type PuzzleRatingInfo = {
  rating: number;
  deviation: number;
  attempts: number;
};

/** A pool puzzle near your puzzle rating, of the theme if given - null
 * when the pool has none left for you. */
export async function getNextPuzzle(
  accessToken: string,
  theme?: string,
): Promise<PoolPuzzle | null> {
  try {
    return (
      await apiClient.get<PoolPuzzle>('/puzzles/next', {
        ...bearer(accessToken),
        params: theme ? { theme } : undefined,
      })
    ).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function attemptPuzzle(
  id: string,
  solved: boolean,
  accessToken: string,
): Promise<{ ratingBefore: number; ratingAfter: number }> {
  return (
    await apiClient.post<{ ratingBefore: number; ratingAfter: number }>(
      `/puzzles/${encodeURIComponent(id)}/attempt`,
      { solved },
      bearer(accessToken),
    )
  ).data;
}

export async function getPuzzleRating(
  accessToken: string,
): Promise<PuzzleRatingInfo> {
  return (
    await apiClient.get<PuzzleRatingInfo>(
      '/puzzles/rating',
      bearer(accessToken),
    )
  ).data;
}

/** A tactic you missed in one of your games, kept to practise: the position
 * (you to move) and the line that won. */
export type PersonalPuzzle = {
  id: string;
  gameId: string;
  ply: number;
  fen: string;
  solution: string[];
  themes: string[];
  dueAt: string;
  step: number;
};

export type PersonalPuzzles = {
  due: PersonalPuzzle[];
  dueCount: number;
  learning: number;
  mastered: number;
};

export type NewPersonalPuzzle = Pick<
  PersonalPuzzle,
  'ply' | 'fen' | 'solution' | 'themes'
>;

export async function getMyPuzzles(
  accessToken: string,
): Promise<PersonalPuzzles> {
  return (
    await apiClient.get<PersonalPuzzles>('/puzzles/mine', bearer(accessToken))
  ).data;
}

export async function addMyPuzzles(
  gameId: string,
  puzzles: NewPersonalPuzzle[],
  accessToken: string,
): Promise<number> {
  return (
    await apiClient.post<{ added: number }>(
      '/puzzles/mine',
      { gameId, puzzles },
      bearer(accessToken),
    )
  ).data.added;
}

export async function attemptMyPuzzle(
  id: string,
  solved: boolean,
  accessToken: string,
): Promise<PersonalPuzzle> {
  return (
    await apiClient.post<PersonalPuzzle>(
      `/puzzles/mine/${encodeURIComponent(id)}/attempt`,
      { solved },
      bearer(accessToken),
    )
  ).data;
}
