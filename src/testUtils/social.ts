import { Social } from '../hooks/useSocial';
import {
  Challenge,
  DirectMessage,
  Friend,
  FriendRequest,
  UserProfile,
} from '../network/restClient';

export function makeFriend(overrides: Partial<Friend> = {}): Friend {
  return {
    id: 'friend-1',
    username: 'judit',
    displayName: 'Judit Polgar',
    avatarColor: '#D64545',
    lastSeenAt: '2026-10-27T10:00:00.000Z',
    online: false,
    playingGameId: null,
    ratings: [
      { category: 'blitz', rating: 1650, gamesPlayed: 40, provisional: false },
    ],
    ...overrides,
  };
}

export function makeFriendRequest(
  overrides: Partial<FriendRequest> = {},
): FriendRequest {
  return {
    id: 'request-1',
    user: makeFriend({ id: 'requester-1', username: 'magnus' }),
    createdAt: '2026-10-27T10:00:00.000Z',
    ...overrides,
  };
}

export function makeChallenge(overrides: Partial<Challenge> = {}): Challenge {
  return {
    id: 'challenge-1',
    challenger: {
      id: 'friend-1',
      username: 'judit',
      displayName: 'Judit Polgar',
      avatarColor: '#D64545',
    },
    opponent: {
      id: 'user-1',
      username: 'me',
      displayName: 'Me',
      avatarColor: '#3b82f6',
    },
    initialSeconds: 300,
    incrementSeconds: 0,
    gameType: 'blitz',
    rated: true,
    status: 'pending',
    gameId: null,
    createdAt: '2026-10-27T10:00:00.000Z',
    expiresAt: '2026-10-27T10:02:00.000Z',
    ...overrides,
  };
}

export function makeUserProfile(
  overrides: Partial<UserProfile> = {},
): UserProfile {
  return {
    id: 'friend-1',
    username: 'judit',
    displayName: 'Judit Polgar',
    bio: null,
    avatarColor: '#D64545',
    isGuest: false,
    ratings: [
      { category: 'blitz', rating: 1650, gamesPlayed: 40, provisional: false },
    ],
    createdAt: '2025-06-01T00:00:00.000Z',
    lastSeenAt: '2026-10-27T10:00:00.000Z',
    online: false,
    playingGameId: null,
    gamesPlayed: 42,
    timePlayedMs: 3 * 60 * 60 * 1000,
    friendship: { status: 'friends', requestId: null },
    score: { wins: 2, draws: 1, losses: 3 },
    ...overrides,
  };
}

export function makeDirectMessage(
  overrides: Partial<DirectMessage> = {},
): DirectMessage {
  return {
    id: 'message-1',
    senderId: 'friend-1',
    recipientId: 'user-1',
    text: 'Hello',
    createdAt: '2026-10-27T10:00:00.000Z',
    ...overrides,
  };
}

/** A signed-in player's social state, with every action a resolved mock. */
export function makeSocial(overrides: Partial<Social> = {}): Social {
  return {
    isAvailable: true,
    friends: [],
    requests: { incoming: [], outgoing: [] },
    challenges: { incoming: [], outgoing: [] },
    unreadByUserId: {},
    reload: jest.fn(),
    sendFriendRequest: jest.fn().mockResolvedValue(undefined),
    respondToFriendRequest: jest.fn().mockResolvedValue(undefined),
    cancelFriendRequest: jest.fn().mockResolvedValue(undefined),
    removeFriend: jest.fn().mockResolvedValue(undefined),
    challenge: jest.fn().mockResolvedValue(undefined),
    acceptChallenge: jest.fn().mockResolvedValue(undefined),
    declineChallenge: jest.fn().mockResolvedValue(undefined),
    cancelChallenge: jest.fn().mockResolvedValue(undefined),
    markConversationRead: jest.fn(),
    ...overrides,
  };
}
