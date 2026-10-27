import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import {
  clearMessages,
  DirectMessage,
  getMessages,
  markMessagesRead,
  sendMessage,
} from '../network/restClient';

const PAGE_SIZE = 50;

export type DirectMessages = {
  /** Oldest first. */
  messages: DirectMessage[];
  status: 'loading' | 'ready' | 'error';
  hasOlder: boolean;
  loadOlder: () => void;
  send: (text: string) => Promise<void>;
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

// The signed-in player's messages with one friend: history a page at a
// time, new messages as they arrive, and everything marked read while the
// conversation is open.
export function useDirectMessages(
  username: string,
  otherUserId: string,
  onRead: () => void,
): DirectMessages {
  const session = useAuthSession();
  const { authorized } = session;
  const socket = session.isReady ? session.socket : null;
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [status, setStatus] = useState<DirectMessages['status']>('loading');
  const [hasOlder, setHasOlder] = useState(false);
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
      }
    }
    socket.on('dm:message', handleMessage);
    return () => {
      socket.off('dm:message', handleMessage);
    };
  }, [socket, otherUserId, markRead]);

  const oldest = messages[0]?.createdAt;
  const loadOlder = useCallback(() => {
    if (hasOlder && oldest) {
      loadPage(oldest).catch(() => {});
    }
  }, [hasOlder, oldest, loadPage]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }
      const sent = await authorized((token) =>
        sendMessage(username, trimmed, token),
      );
      setMessages((current) => withMessages(current, [sent]));
    },
    [authorized, username],
  );

  const clear = useCallback(async () => {
    await authorized((token) => clearMessages(username, token));
    setMessages([]);
    setHasOlder(false);
  }, [authorized, username]);

  return { messages, status, hasOlder, loadOlder, send, clear };
}
