import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import {
  ApiError,
  clearMessages,
  DirectMessage,
  getMessages,
  getTheirLastReadAt,
  markMessagesRead,
  MessageAttachment,
  sendMessage,
} from '../network/restClient';

const PAGE_SIZE = 50;

/** A message as a conversation shows it: sent, or one of yours still on
 * its way - or that didn't make it, to try again. */
export type ShownMessage = DirectMessage & {
  delivery: 'sent' | 'sending' | 'failed';
};

export type DirectMessages = {
  /** Oldest first, yours still on their way last. */
  messages: ShownMessage[];
  status: 'loading' | 'ready' | 'error';
  hasOlder: boolean;
  loadOlder: () => void;
  /** When they last read your messages - null until they have. */
  theirLastReadAt: string | null;
  /** Sends at once, showing the message as it goes. Resolves either way;
   * one that fails is shown so, to `retry` - with the server's reason, if
   * it gave one, for the caller to say. */
  send: (
    text: string,
    attachment?: MessageAttachment,
  ) => Promise<{ failure: string | null }>;
  retry: (id: string) => Promise<{ failure: string | null }>;
  clear: () => Promise<void>;
};

function withMessages(
  current: DirectMessage[],
  added: DirectMessage[],
): DirectMessage[] {
  const known = new Set(current.map((message) => message.id));
  return [
    ...current,
    ...added.filter((message) => !known.has(message.id)),
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

type Pending = DirectMessage & { delivery: 'sending' | 'failed' };

let nextPendingId = 0;

/** The server's own reason a message wasn't sent - not friends any more,
 * too many too fast - or null when it couldn't be reached at all. */
function failureOf(error: unknown): string | null {
  return error instanceof ApiError && error.status !== 0 ? error.message : null;
}

// The signed-in player's messages with one friend: history a page at a
// time, new messages as they arrive, everything marked read while the
// conversation is open, and whether they've read yours.
export function useDirectMessages(
  username: string,
  otherUserId: string,
  onRead: () => void,
): DirectMessages {
  const session = useAuthSession();
  const { authorized } = session;
  const socket = session.isReady ? session.socket : null;
  const myUserId = session.isReady ? session.user.id : '';
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [status, setStatus] = useState<DirectMessages['status']>('loading');
  const [hasOlder, setHasOlder] = useState(false);
  const [theirLastReadAt, setTheirLastReadAt] = useState<string | null>(null);
  const onReadRef = useRef(onRead);

  useEffect(() => {
    onReadRef.current = onRead;
  }, [onRead]);

  const markRead = useCallback(() => {
    onReadRef.current();
    authorized((token) => markMessagesRead(username, token)).catch(() => {});
  }, [authorized, username]);

  const loadPage = useCallback(
    (before?: string) =>
      authorized((token) =>
        getMessages(username, { limit: PAGE_SIZE, before }, token),
      ).then((page) => {
        setMessages((current) => withMessages(current, page));
        setHasOlder(page.length === PAGE_SIZE);
        setStatus('ready');
      }),
    [authorized, username],
  );

  useEffect(() => {
    loadPage()
      .then(markRead)
      .catch(() => setStatus('error'));
  }, [loadPage, markRead]);

  useEffect(() => {
    authorized((token) => getTheirLastReadAt(username, token))
      .then(setTheirLastReadAt)
      .catch(() => {});
  }, [authorized, username]);

  useEffect(() => {
    if (!socket) {
      return;
    }
    function handleMessage(message: DirectMessage) {
      const isInConversation =
        message.senderId === otherUserId || message.recipientId === otherUserId;
      if (!isInConversation) {
        return;
      }
      setMessages((current) => withMessages(current, [message]));
      if (message.senderId === otherUserId) {
        markRead();
      } else {
        // The push of one of ours can beat the reply to sending it: it
        // stands in for the one still showing as on its way.
        setPending((current) => {
          const index = current.findIndex(
            (each) => each.delivery === 'sending' && each.text === message.text,
          );
          return index === -1
            ? current
            : [...current.slice(0, index), ...current.slice(index + 1)];
        });
      }
    }
    function handleRead(payload: { userId: string; readAt: string }) {
      if (payload.userId === otherUserId) setTheirLastReadAt(payload.readAt);
    }
    socket.on('dm:message', handleMessage);
    socket.on('dm:read', handleRead);
    return () => {
      socket.off('dm:message', handleMessage);
      socket.off('dm:read', handleRead);
    };
  }, [socket, otherUserId, markRead]);

  const oldest = messages[0]?.createdAt;
  const loadOlder = useCallback(() => {
    if (hasOlder && oldest) {
      loadPage(oldest).catch(() => {});
    }
  }, [hasOlder, oldest, loadPage]);

  const deliver = useCallback(
    async (shown: Pending): Promise<{ failure: string | null }> => {
      try {
        const sent = await authorized((token) =>
          sendMessage(
            username,
            {
              text: shown.text,
              ...(shown.attachment && { attachment: shown.attachment }),
            },
            token,
          ),
        );
        setPending((current) => current.filter((each) => each.id !== shown.id));
        setMessages((current) => withMessages(current, [sent]));
        return { failure: null };
      } catch (error) {
        setPending((current) =>
          current.map((each) =>
            each.id === shown.id ? { ...each, delivery: 'failed' } : each,
          ),
        );
        return { failure: failureOf(error) };
      }
    },
    [authorized, username],
  );

  const send = useCallback(
    async (text: string, attachment?: MessageAttachment) => {
      const trimmed = text.trim();
      if (!trimmed && !attachment) {
        return { failure: null };
      }
      nextPendingId += 1;
      const shown: Pending = {
        id: `pending-${nextPendingId}`,
        senderId: myUserId,
        recipientId: otherUserId,
        text: trimmed,
        attachment: attachment ?? null,
        createdAt: new Date().toISOString(),
        delivery: 'sending',
      };
      setPending((current) => [...current, shown]);
      return deliver(shown);
    },
    [deliver, myUserId, otherUserId],
  );

  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  const retry = useCallback(
    async (id: string) => {
      const failed = pendingRef.current.find(
        (each) => each.id === id && each.delivery === 'failed',
      );
      if (!failed) {
        return { failure: null };
      }
      const again: Pending = { ...failed, delivery: 'sending' };
      setPending((current) =>
        current.map((each) => (each.id === id ? again : each)),
      );
      return deliver(again);
    },
    [deliver],
  );

  const clear = useCallback(async () => {
    await authorized((token) => clearMessages(username, token));
    setMessages([]);
    setPending([]);
    setHasOlder(false);
  }, [authorized, username]);

  const shown = useMemo<ShownMessage[]>(
    () => [
      ...messages.map((message) => ({ ...message, delivery: 'sent' as const })),
      ...pending,
    ],
    [messages, pending],
  );
  return {
    messages: shown,
    status,
    hasOlder,
    loadOlder,
    theirLastReadAt,
    send,
    retry,
    clear,
  };
}
