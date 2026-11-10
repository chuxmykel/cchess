import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import {
  clearMessages,
  ConversationSummary,
  DirectMessage,
  getConversations,
  markMessagesRead,
} from '../network/restClient';

export const CONVERSATIONS_PAGE_SIZE = 30;

const NO_CONVERSATIONS: ConversationSummary[] = [];

export type Conversations = {
  /** Newest message first; null until the first page has come. */
  conversations: ConversationSummary[] | null;
  status: 'loading' | 'ready' | 'error';
  hasMore: boolean;
  loadMore: () => void;
  /** Fetches the first page again, for pull to refresh and refocusing. */
  reload: () => Promise<void>;
  markRead: (conversation: ConversationSummary) => Promise<void>;
  /** Clears it, for you only - gone from the list until a new message. */
  remove: (conversation: ConversationSummary) => Promise<void>;
};

function otherIdOf(message: DirectMessage, myUserId: string): string {
  return message.senderId === myUserId ? message.recipientId : message.senderId;
}

// The signed-in player's inbox: everyone they have messages with, the one
// with the newest message first - kept current as messages come and go,
// and as the other person reads yours. Unread counts are SocialContext's,
// which the tab's badge shows too; a guest, who can't message, has none.
export function useConversations(): Conversations {
  const session = useAuthSession();
  const { authorized } = session;
  const socket = session.isReady ? session.socket : null;
  const myUserId = session.isReady ? session.user.id : null;
  const canMessage = session.isReady && !session.user.isGuest;
  const [conversations, setConversations] = useState<
    ConversationSummary[] | null
  >(null);
  const [status, setStatus] = useState<Conversations['status']>('loading');
  const [hasMore, setHasMore] = useState(false);
  const loadingMore = useRef(false);
  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const reload = useCallback(
    () =>
      canMessage
        ? authorized((token) =>
            getConversations({ limit: CONVERSATIONS_PAGE_SIZE }, token),
          ).then(
            (page) => {
              setConversations(page);
              setHasMore(page.length === CONVERSATIONS_PAGE_SIZE);
              setStatus('ready');
            },
            () => {
              // Keep what's shown when a refresh fails.
              setStatus((current) => (current === 'ready' ? current : 'error'));
            },
          )
        : Promise.resolve(),
    [authorized, canMessage],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  const oldest = conversations?.at(-1)?.lastMessage.createdAt;
  const loadMore = useCallback(() => {
    if (!hasMore || !oldest || loadingMore.current) return;
    loadingMore.current = true;
    authorized((token) =>
      getConversations(
        { limit: CONVERSATIONS_PAGE_SIZE, before: oldest },
        token,
      ),
    )
      .then((page) => {
        setConversations((current) => {
          const known = new Set((current ?? []).map((each) => each.user.id));
          return [
            ...(current ?? []),
            ...page.filter((each) => !known.has(each.user.id)),
          ];
        });
        setHasMore(page.length === CONVERSATIONS_PAGE_SIZE);
      })
      .catch(() => {})
      .finally(() => {
        loadingMore.current = false;
      });
  }, [authorized, hasMore, oldest]);

  useEffect(() => {
    if (!socket || !myUserId) return;
    function handleMessage(message: DirectMessage) {
      const otherId = otherIdOf(message, myUserId!);
      const isKnown = conversationsRef.current?.some(
        (each) => each.user.id === otherId,
      );
      // Someone new - or back after being cleared: who they are comes
      // with the list.
      if (!isKnown) {
        void reload();
        return;
      }
      setConversations((current) => {
        const existing = current?.find((each) => each.user.id === otherId);
        if (!current || !existing) return current;
        return [
          { ...existing, lastMessage: message },
          ...current.filter((each) => each !== existing),
        ];
      });
    }
    function handleRead({
      userId,
      readAt,
    }: {
      userId: string;
      readAt: string;
    }) {
      setConversations(
        (current) =>
          current?.map((each) =>
            each.user.id === userId
              ? { ...each, theirLastReadAt: readAt }
              : each,
          ) ?? current,
      );
    }
    socket.on('dm:message', handleMessage);
    socket.on('dm:read', handleRead);
    return () => {
      socket.off('dm:message', handleMessage);
      socket.off('dm:read', handleRead);
    };
  }, [socket, myUserId, reload]);

  const markRead = useCallback(
    async (conversation: ConversationSummary) => {
      await authorized((token) =>
        markMessagesRead(conversation.user.username, token),
      );
    },
    [authorized],
  );

  const remove = useCallback(
    async (conversation: ConversationSummary) => {
      await authorized((token) =>
        clearMessages(conversation.user.username, token),
      );
      setConversations(
        (current) =>
          current?.filter((each) => each.user.id !== conversation.user.id) ??
          current,
      );
    },
    [authorized],
  );

  // A guest's inbox is empty, and never fetched.
  if (!canMessage) {
    return {
      conversations: NO_CONVERSATIONS,
      status: 'ready',
      hasMore: false,
      loadMore,
      reload,
      markRead,
      remove,
    };
  }
  return {
    conversations,
    status,
    hasMore,
    loadMore,
    reload,
    markRead,
    remove,
  };
}
