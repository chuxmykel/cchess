import { useCallback, useEffect, useState } from 'react';

import { AppSocket } from '../network/socketClient';
import { ChatHistoryPayload, ChatMessage } from '../network/socketEvents';

export type UseGameChatResult = {
  messages: ChatMessage[];
  unreadCount: number;
  send: (text: string) => void;
};

/** A game's chat with the sheet it's read in, for a game screen. */
export type GameChat = UseGameChatResult & {
  myUserId: string;
  isOpen: boolean;
  /** No more messages can be sent; the history stays readable. */
  isClosed: boolean;
  open: () => void;
  close: () => void;
};

/** How far the chat's been read, and whether this app marked it so -
 * which the server still needs telling - or heard it from the server. */
type ReadMark = { at: string | null; isLocal: boolean };

function withMessageAdded(
  messages: ChatMessage[],
  message: ChatMessage,
): ChatMessage[] {
  return messages.some((existing) => existing.id === message.id)
    ? messages
    : [...messages, message];
}

/** Whether a message counts as unread until seen: the opponent's words,
 * and every note of a draw - mine too. */
function countsAsUnread(message: ChatMessage, myUserId: string): boolean {
  return message.kind !== 'message' || message.userId !== myUserId;
}

// A game's chat: its history (asked for once listening, and again after a
// reconnect), new messages as they arrive, and how many arrived unseen -
// counted from how far the server says I've read, and marked read there
// whenever the chat is open.
export function useGameChat(
  socket: AppSocket,
  gameId: string,
  myUserId: string,
  isOpen: boolean,
): UseGameChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [read, setRead] = useState<ReadMark>({ at: null, isLocal: false });

  useEffect(() => {
    function handleMessage(message: ChatMessage) {
      if (message.gameId === gameId) {
        setMessages((previous) => withMessageAdded(previous, message));
      }
    }

    function handleHistory(payload: ChatHistoryPayload) {
      if (payload.gameId === gameId) {
        setMessages(payload.messages);
        setRead({ at: payload.readAt, isLocal: false });
      }
    }

    function requestHistory() {
      socket.emit('game:chatHistory', { gameId });
    }

    socket.on('game:chat', handleMessage);
    socket.on('game:chatHistory', handleHistory);
    socket.on('connect', requestHistory);
    requestHistory();

    return () => {
      socket.off('game:chat', handleMessage);
      socket.off('game:chatHistory', handleHistory);
      socket.off('connect', requestHistory);
    };
  }, [socket, gameId]);

  // Open, everything in it is seen: mark it read up to the newest message.
  const newest = messages.at(-1)?.createdAt ?? null;
  if (isOpen && newest && (read.at === null || newest > read.at)) {
    setRead({ at: newest, isLocal: true });
  }

  // ...and tell the server, once for each mark made here.
  useEffect(() => {
    if (read.isLocal) {
      socket.emit('game:chatRead', { gameId });
    }
  }, [read, socket, gameId]);

  const unreadCount = messages.filter(
    (message) =>
      (read.at === null || message.createdAt > read.at) &&
      countsAsUnread(message, myUserId),
  ).length;

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (trimmed) {
        socket.emit('game:chat', { gameId, text: trimmed });
      }
    },
    [socket, gameId],
  );

  return { messages, unreadCount, send };
}

// A game's chat as a game screen shows it: in a sheet, opened and closed
// here, and marked read while it's open.
export function useGameChatSheet(
  socket: AppSocket,
  gameId: string,
  myUserId: string,
  isClosed = false,
): GameChat {
  const [isOpen, setIsOpen] = useState(false);
  const chat = useGameChat(socket, gameId, myUserId, isOpen);
  return {
    ...chat,
    myUserId,
    isOpen,
    isClosed,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}
