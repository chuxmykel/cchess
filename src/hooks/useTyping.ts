import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { DirectMessage } from '../network/restClient';

/** While you type, the friend you're writing to is told this often. */
export const TYPING_SEND_EVERY_MS = 3_000;
/** A friend shows as typing this long after they last said so - a little
 * more than how often they say it, so a slow network doesn't flicker it. */
export const TYPING_SHOWN_FOR_MS = 5_000;

/**
 * Who's typing a message to you, by user id - each until they stop saying
 * so for TYPING_SHOWN_FOR_MS, or their message arrives.
 */
export function useTypingFriends(): ReadonlySet<string> {
  const session = useAuthSession();
  const socket = session.isReady ? session.socket : null;
  const [typing, setTyping] = useState<ReadonlySet<string>>(new Set());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    if (!socket) return;
    const pending = timers.current;
    function stop(userId: string) {
      const timer = pending.get(userId);
      if (timer) clearTimeout(timer);
      pending.delete(userId);
      setTyping((current) => {
        if (!current.has(userId)) return current;
        const next = new Set(current);
        next.delete(userId);
        return next;
      });
    }
    function handleTyping({ userId }: { userId: string }) {
      const timer = pending.get(userId);
      if (timer) clearTimeout(timer);
      pending.set(
        userId,
        setTimeout(() => stop(userId), TYPING_SHOWN_FOR_MS),
      );
      setTyping((current) =>
        current.has(userId) ? current : new Set(current).add(userId),
      );
    }
    function handleMessage(message: DirectMessage) {
      stop(message.senderId);
    }
    socket.on('dm:typing', handleTyping);
    socket.on('dm:message', handleMessage);
    return () => {
      socket.off('dm:typing', handleTyping);
      socket.off('dm:message', handleMessage);
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, [socket]);

  return typing;
}

/**
 * A function to call as you type to `userId` - it tells them at most once
 * every TYPING_SEND_EVERY_MS, and not at all for a cleared draft.
 */
export function useSendTyping(userId: string): (draft: string) => void {
  const session = useAuthSession();
  const socket = session.isReady ? session.socket : null;
  const lastSentAt = useRef(0);

  return useCallback(
    (draft: string) => {
      if (!socket || !draft.trim()) return;
      const now = Date.now();
      if (now - lastSentAt.current < TYPING_SEND_EVERY_MS) return;
      lastSentAt.current = now;
      socket.emit('dm:typing', { userId });
    },
    [socket, userId],
  );
}
