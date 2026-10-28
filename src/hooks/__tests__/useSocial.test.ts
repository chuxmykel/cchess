import { act, renderHook } from '@testing-library/react-native';

import { useSocial } from '../useSocial';
import { useAuthSession } from '../../context/AuthSessionContext';
import {
  acceptChallenge,
  createChallenge,
  getChallenges,
  getFriendRequests,
  getFriends,
  getUnreadMessageCounts,
  respondToFriendRequest,
} from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { createFakeSocket, FakeSocket } from '../../testUtils/fakeSocket';
import { makeGameSnapshot } from '../../testUtils/gameSnapshot';
import {
  makeChallenge,
  makeDirectMessage,
  makeFriend,
  makeFriendRequest,
} from '../../testUtils/social';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getFriends: jest.fn(),
  getFriendRequests: jest.fn(),
  getChallenges: jest.fn(),
  getUnreadMessageCounts: jest.fn(),
  respondToFriendRequest: jest.fn(),
  createChallenge: jest.fn(),
  acceptChallenge: jest.fn(),
}));

const FRIEND = makeFriend();
const INCOMING_REQUEST = makeFriendRequest();
const INCOMING_CHALLENGE = makeChallenge();
const NO_REQUESTS = { incoming: [], outgoing: [] };

describe('useSocial', () => {
  let fake: FakeSocket;
  const onGameStarted = jest.fn();

  beforeEach(() => {
    fake = createFakeSocket();
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({
        user: { id: 'user-1', isGuest: false },
        socket: fake.socket,
      }),
    );
    (getFriends as jest.Mock).mockResolvedValue([FRIEND]);
    (getFriendRequests as jest.Mock).mockResolvedValue({
      incoming: [INCOMING_REQUEST],
      outgoing: [],
    });
    (getChallenges as jest.Mock).mockResolvedValue({
      incoming: [INCOMING_CHALLENGE],
      outgoing: [],
    });
    (getUnreadMessageCounts as jest.Mock).mockResolvedValue([
      { userId: FRIEND.id, count: 2 },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  async function renderSocial() {
    const rendered = await renderHook(() => useSocial(onGameStarted));
    await act(async () => {});
    return rendered;
  }

  it('loads friends, requests, challenges and unread counts', async () => {
    const { result } = await renderSocial();

    expect(result.current.isAvailable).toBe(true);
    expect(result.current.friends).toEqual([FRIEND]);
    expect(result.current.requests.incoming).toEqual([INCOMING_REQUEST]);
    expect(result.current.challenges.incoming).toEqual([INCOMING_CHALLENGE]);
    expect(result.current.unreadByUserId).toEqual({ [FRIEND.id]: 2 });
  });

  it('loads nothing for a guest', async () => {
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ user: { isGuest: true }, socket: fake.socket }),
    );

    const { result } = await renderSocial();

    expect(result.current.isAvailable).toBe(false);
    expect(result.current.friends).toBeNull();
    expect(getFriends).not.toHaveBeenCalled();
  });

  it("updates a friend's status when the server says it changed", async () => {
    const { result } = await renderSocial();

    await act(() =>
      fake.trigger('friend:status', {
        userId: FRIEND.id,
        online: true,
        playingGameId: 'game-9',
      }),
    );

    expect(result.current.friends?.[0]).toMatchObject({
      online: true,
      playingGameId: 'game-9',
    });
  });

  it('adds and removes friend requests as they arrive and resolve', async () => {
    const { result } = await renderSocial();
    const another = makeFriendRequest({ id: 'request-2' });

    await act(() => fake.trigger('friend:requestReceived', another));
    expect(result.current.requests.incoming.map((r) => r.id)).toEqual([
      'request-2',
      'request-1',
    ]);

    await act(() =>
      fake.trigger('friend:requestResolved', { id: 'request-1' }),
    );
    expect(result.current.requests.incoming.map((r) => r.id)).toEqual([
      'request-2',
    ]);
  });

  it('reloads the friends list once a request is accepted', async () => {
    const { result } = await renderSocial();
    (respondToFriendRequest as jest.Mock).mockResolvedValue(undefined);
    (getFriendRequests as jest.Mock).mockResolvedValue(NO_REQUESTS);

    await act(() => result.current.respondToFriendRequest('request-1', true));

    expect(respondToFriendRequest).toHaveBeenCalledWith(
      'request-1',
      true,
      'access-token',
    );
    expect(result.current.requests.incoming).toEqual([]);
    expect(getFriends).toHaveBeenCalledTimes(2);
  });

  it('starts the game when I accept a challenge', async () => {
    const { result } = await renderSocial();
    (acceptChallenge as jest.Mock).mockResolvedValue(
      makeGameSnapshot({ id: 'game-7' }),
    );

    await act(() => result.current.acceptChallenge(INCOMING_CHALLENGE.id));

    expect(onGameStarted).toHaveBeenCalledWith('game-7');
    expect(result.current.challenges.incoming).toEqual([]);
  });

  it('starts the game when my challenge is accepted', async () => {
    const outgoing = makeChallenge({ id: 'challenge-2' });
    (createChallenge as jest.Mock).mockResolvedValue(outgoing);
    const { result } = await renderSocial();

    await act(() =>
      result.current.challenge({
        opponentUsername: 'judit',
        initialSeconds: 300,
        incrementSeconds: 0,
        rated: true,
      }),
    );
    expect(result.current.challenges.outgoing).toEqual([outgoing]);

    await act(() =>
      fake.trigger('challenge:accepted', {
        ...outgoing,
        status: 'accepted',
        gameId: 'game-8',
      }),
    );

    expect(onGameStarted).toHaveBeenCalledWith('game-8');
    expect(result.current.challenges.outgoing).toEqual([]);
  });

  it('drops a challenge once it is declined, cancelled or expired', async () => {
    const { result } = await renderSocial();

    await act(() =>
      fake.trigger('challenge:resolved', {
        ...INCOMING_CHALLENGE,
        status: 'expired',
      }),
    );

    expect(result.current.challenges.incoming).toEqual([]);
  });

  it('counts messages sent to me until the conversation is read', async () => {
    const { result } = await renderSocial();

    await act(() => fake.trigger('dm:message', makeDirectMessage()));
    expect(result.current.unreadByUserId[FRIEND.id]).toBe(3);

    await act(() => result.current.markConversationRead(FRIEND.id));
    expect(result.current.unreadByUserId[FRIEND.id]).toBeUndefined();
  });

  it("doesn't count my own messages as unread", async () => {
    const { result } = await renderSocial();

    await act(() =>
      fake.trigger(
        'dm:message',
        makeDirectMessage({ senderId: 'user-1', recipientId: FRIEND.id }),
      ),
    );

    expect(result.current.unreadByUserId).toEqual({ [FRIEND.id]: 2 });
  });

  it('reloads after reconnecting', async () => {
    await renderSocial();

    await act(async () => fake.trigger('connect', undefined));

    expect(getFriends).toHaveBeenCalledTimes(2);
  });
});
