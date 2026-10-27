import { useCallback, useEffect, useState } from 'react';

import { AppSocket } from '../network/socketClient';
import { ChatHistoryPayload, ChatMessage } from '../network/socketEvents';

export type UseGameChatResult = {
  messages: ChatMessage[];
  unreadCount: number;
  send: (text: string) => void;
};

function withMessageAdded(
  messages: ChatMessage[],
  message: ChatMessage,
): ChatMessage[] {
  return messages.some((existing) => existing.id === message.id)
    ? messages
    : [...messages, message];
}

// A game's chat: its history (asked for once listening, and again after a
// reconnect), new messages as they arrive, and how many of the opponent's
// arrived while the chat was closed.
export function useGameChat(
  socket: AppSocket,
  gameId: string,
  myUserId: string,
  isOpen: boolean,
): UseGameChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [readCount, setReadCount] = useState(0);

  useEffect(() => {
    function handleMessage(message: ChatMessage) {
      if (message.gameId === gameId) {
        setMessages((previous) => withMessageAdded(previous, message));
      }
    }

    function handleHistory(payload: ChatHistoryPayload) {
      if (payload.gameId === gameId) {
        setMessages(payload.messages);
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

  if (isOpen && readCount !== messages.length) {
    setReadCount(messages.length);
  }

  const unreadCount = messages
    .slice(readCount)
    .filter((message) => message.userId !== myUserId).length;

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
