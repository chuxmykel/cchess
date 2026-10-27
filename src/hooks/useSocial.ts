import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import {
  acceptChallenge as acceptChallengeRequest,
  cancelChallenge as cancelChallengeRequest,
  cancelFriendRequest as cancelFriendRequestRequest,
  Challenge,
  Challenges,
  createChallenge,
  declineChallenge as declineChallengeRequest,
  DirectMessage,
  Friend,
  FriendRequest,
  FriendRequests,
  getChallenges,
  getFriendRequests,
  getFriends,
  getUnreadMessageCounts,
  NewChallenge,
  removeFriend as removeFriendRequest,
  respondToFriendRequest as respondToFriendRequestRequest,
  sendFriendRequest as sendFriendRequestRequest,
} from '../network/restClient';
import { FriendStatusPayload } from '../network/socketEvents';

type SocialData = {
  friends: Friend[];
  requests: FriendRequests;
  challenges: Challenges;
  unreadByUserId: Record<string, number>;
};

export type Social = {
  /** False for guests, who can't have friends. */
  isAvailable: boolean;
  /** Null until the first load finishes. */
  friends: Friend[] | null;
  requests: FriendRequests;
  challenges: Challenges;
  unreadByUserId: Record<string, number>;
  reload: () => void;
  sendFriendRequest: (username: string) => Promise<void>;
  respondToFriendRequest: (requestId: string, accept: boolean) => Promise<void>;
  cancelFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (username: string) => Promise<void>;
  challenge: (challenge: NewChallenge) => Promise<void>;
  acceptChallenge: (challengeId: string) => Promise<void>;
  declineChallenge: (challengeId: string) => Promise<void>;
  cancelChallenge: (challengeId: string) => Promise<void>;
  markConversationRead: (userId: string) => void;
};

const NO_REQUESTS: FriendRequests = { incoming: [], outgoing: [] };
const NO_CHALLENGES: Challenges = { incoming: [], outgoing: [] };

function withoutRequest(
  requests: FriendRequests,
  requestId: string,
): FriendRequests {
  return {
    incoming: requests.incoming.filter((request) => request.id !== requestId),
    outgoing: requests.outgoing.filter((request) => request.id !== requestId),
  };
}

function withoutChallenge(
  challenges: Challenges,
  challengeId: string,
): Challenges {
  return {
    incoming: challenges.incoming.filter((c) => c.id !== challengeId),
    outgoing: challenges.outgoing.filter((c) => c.id !== challengeId),
  };
}

function withFriendStatus(
  friends: Friend[],
  { userId, online, playingGameId }: FriendStatusPayload,
): Friend[] {
  return friends.map((friend) =>
    friend.id === userId
      ? {
          ...friend,
          online,
          playingGameId,
          lastSeenAt: online ? friend.lastSeenAt : new Date().toISOString(),
        }
      : friend,
  );
}

// The signed-in player's friends, friend requests, challenges and unread
// messages, kept current from the server's pushes.
export function useSocial(onGameStarted: (gameId: string) => void): Social {
  const session = useAuthSession();
  const { authorized } = session;
  const user = session.isReady ? session.user : null;
  const socket = session.isReady ? session.socket : null;
  const userId = user && !user.isGuest ? user.id : null;
  const [loaded, setLoaded] = useState<
    ({ userId: string } & SocialData) | null
  >(null);
  const latestLoad = useRef(0);
  const onGameStartedRef = useRef(onGameStarted);

  useEffect(() => {
    onGameStartedRef.current = onGameStarted;
  }, [onGameStarted]);

  const data: SocialData | null = loaded?.userId === userId ? loaded : null;

  const update = useCallback(
    (change: (current: SocialData) => SocialData) => {
      setLoaded((current) =>
        current && current.userId === userId
          ? { userId: current.userId, ...change(current) }
          : current,
      );
    },
    [userId],
  );

  const reload = useCallback(() => {
    if (!userId) {
      return;
    }
    latestLoad.current += 1;
    const loadId = latestLoad.current;
    authorized((accessToken) =>
      Promise.all([
        getFriends(accessToken),
        getFriendRequests(accessToken),
        getChallenges(accessToken),
        getUnreadMessageCounts(accessToken),
      ]),
    )
      .then(([friends, requests, challenges, unread]) => {
        if (loadId !== latestLoad.current) {
          return;
        }
        setLoaded({
          userId,
          friends,
          requests,
          challenges,
          unreadByUserId: Object.fromEntries(
            unread.map(({ userId: senderId, count }) => [senderId, count]),
          ),
        });
      })
      .catch(() => {});
  }, [userId, authorized]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!socket || !userId) {
      return;
    }

    function handleStatus(status: FriendStatusPayload) {
      update((current) => ({
        ...current,
        friends: withFriendStatus(current.friends, status),
      }));
    }

    function handleRequestReceived(request: FriendRequest) {
      update((current) => ({
        ...current,
        requests: {
          ...current.requests,
          incoming: [
            request,
            ...current.requests.incoming.filter((r) => r.id !== request.id),
          ],
        },
      }));
    }

    function handleRequestResolved({ id }: { id: string }) {
      update((current) => ({
        ...current,
        requests: withoutRequest(current.requests, id),
      }));
    }

    function handleChallengeReceived(challenge: Challenge) {
      update((current) => ({
        ...current,
        challenges: {
          ...current.challenges,
          incoming: [
            challenge,
            ...current.challenges.incoming.filter(
              (c) => c.challenger.id !== challenge.challenger.id,
            ),
          ],
        },
      }));
    }

    function handleChallengeAccepted(challenge: Challenge) {
      update((current) => ({
        ...current,
        challenges: withoutChallenge(current.challenges, challenge.id),
      }));
      if (challenge.gameId) {
        onGameStartedRef.current(challenge.gameId);
      }
    }

    function handleChallengeResolved(challenge: Challenge) {
      update((current) => ({
        ...current,
        challenges: withoutChallenge(current.challenges, challenge.id),
      }));
    }

    function handleDirectMessage(message: DirectMessage) {
      if (message.recipientId !== userId) {
        return;
      }
      update((current) => ({
        ...current,
        unreadByUserId: {
          ...current.unreadByUserId,
          [message.senderId]:
            (current.unreadByUserId[message.senderId] ?? 0) + 1,
        },
      }));
    }

    socket.on('friend:status', handleStatus);
    socket.on('friend:requestReceived', handleRequestReceived);
    socket.on('friend:requestAccepted', reload);
    socket.on('friend:requestResolved', handleRequestResolved);
    socket.on('friend:removed', reload);
    socket.on('challenge:received', handleChallengeReceived);
    socket.on('challenge:accepted', handleChallengeAccepted);
    socket.on('challenge:resolved', handleChallengeResolved);
    socket.on('dm:message', handleDirectMessage);
    socket.on('connect', reload);
    return () => {
      socket.off('friend:status', handleStatus);
      socket.off('friend:requestReceived', handleRequestReceived);
      socket.off('friend:requestAccepted', reload);
      socket.off('friend:requestResolved', handleRequestResolved);
      socket.off('friend:removed', reload);
      socket.off('challenge:received', handleChallengeReceived);
      socket.off('challenge:accepted', handleChallengeAccepted);
      socket.off('challenge:resolved', handleChallengeResolved);
      socket.off('dm:message', handleDirectMessage);
      socket.off('connect', reload);
    };
  }, [socket, userId, update, reload]);

  const sendFriendRequest = useCallback(
    async (username: string) => {
      await authorized((token) => sendFriendRequestRequest(username, token));
      reload();
    },
    [authorized, reload],
  );

  const respondToFriendRequest = useCallback(
    async (requestId: string, accept: boolean) => {
      await authorized((token) =>
        respondToFriendRequestRequest(requestId, accept, token),
      );
      update((current) => ({
        ...current,
        requests: withoutRequest(current.requests, requestId),
      }));
      if (accept) {
        reload();
      }
    },
    [authorized, update, reload],
  );

  const cancelFriendRequest = useCallback(
    async (requestId: string) => {
      await authorized((token) => cancelFriendRequestRequest(requestId, token));
      update((current) => ({
        ...current,
        requests: withoutRequest(current.requests, requestId),
      }));
    },
    [authorized, update],
  );

  const removeFriend = useCallback(
    async (username: string) => {
      await authorized((token) => removeFriendRequest(username, token));
      update((current) => ({
        ...current,
        friends: current.friends.filter(
          (friend) => friend.username !== username,
        ),
      }));
    },
    [authorized, update],
  );

  const challenge = useCallback(
    async (newChallenge: NewChallenge) => {
      const sent = await authorized((token) =>
        createChallenge(newChallenge, token),
      );
      update((current) => ({
        ...current,
        challenges: {
          ...current.challenges,
          outgoing: [
            sent,
            ...current.challenges.outgoing.filter(
              (c) => c.opponent.id !== sent.opponent.id,
            ),
          ],
        },
      }));
    },
    [authorized, update],
  );

  const acceptChallenge = useCallback(
    async (challengeId: string) => {
      try {
        const game = await authorized((token) =>
          acceptChallengeRequest(challengeId, token),
        );
        onGameStartedRef.current(game.id);
      } finally {
        update((current) => ({
          ...current,
          challenges: withoutChallenge(current.challenges, challengeId),
        }));
      }
    },
    [authorized, update],
  );

  const declineChallenge = useCallback(
    async (challengeId: string) => {
      await authorized((token) => declineChallengeRequest(challengeId, token));
      update((current) => ({
        ...current,
        challenges: withoutChallenge(current.challenges, challengeId),
      }));
    },
    [authorized, update],
  );

  const cancelChallenge = useCallback(
    async (challengeId: string) => {
      await authorized((token) => cancelChallengeRequest(challengeId, token));
      update((current) => ({
        ...current,
        challenges: withoutChallenge(current.challenges, challengeId),
      }));
    },
    [authorized, update],
  );

  const markConversationRead = useCallback(
    (otherUserId: string) => {
      update((current) => {
        if (!current.unreadByUserId[otherUserId]) {
          return current;
        }
        const { [otherUserId]: _read, ...unreadByUserId } =
          current.unreadByUserId;
        return { ...current, unreadByUserId };
      });
    },
    [update],
  );

  return {
    isAvailable: userId !== null,
    friends: data?.friends ?? null,
    requests: data?.requests ?? NO_REQUESTS,
    challenges: data?.challenges ?? NO_CHALLENGES,
    unreadByUserId: data?.unreadByUserId ?? {},
    reload,
    sendFriendRequest,
    respondToFriendRequest,
    cancelFriendRequest,
    removeFriend,
    challenge,
    acceptChallenge,
    declineChallenge,
    cancelChallenge,
    markConversationRead,
  };
}
