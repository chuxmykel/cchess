import { useCallback, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { useOptionalSocialContext } from '../context/SocialContext';
import {
  ApiError,
  Friend,
  MessageAttachment,
  sendMessage,
} from '../network/restClient';
import { MESSAGE_FAILED_MESSAGE } from '../constants/errorMessages';

export type SendToFriend = {
  /** Whether there's anyone to send to - a guest has no friends. */
  isAvailable: boolean;
  /** Your friends, for the picker; null while they come. */
  friends: Friend[] | null;
  /** What's waiting for a friend to be picked; null with the picker shut. */
  pending: MessageAttachment | null;
  open: (attachment: MessageAttachment) => void;
  close: () => void;
  /** Sends what's pending to `friend`, saying how it went. */
  sendTo: (friend: Friend) => Promise<void>;
};

// A game or a position, sent to a friend picked from a list - from a game's
// menu, or the analysis board's. `onMessage` says it's gone, or why not.
// With no friends, or no SocialProvider above, there's nobody to send to.
export function useSendToFriend(
  onMessage?: (message: string) => void,
): SendToFriend {
  const { authorized } = useAuthSession();
  const social = useOptionalSocialContext();
  const [pending, setPending] = useState<MessageAttachment | null>(null);

  const sendTo = useCallback(
    async (friend: Friend) => {
      const attachment = pending;
      setPending(null);
      if (!attachment) return;
      try {
        await authorized((token) =>
          sendMessage(friend.username, { text: '', attachment }, token),
        );
        onMessage?.(`Sent to ${friend.displayName}`);
      } catch (error) {
        onMessage?.(
          error instanceof ApiError && error.status !== 0
            ? error.message
            : MESSAGE_FAILED_MESSAGE,
        );
      }
    },
    [authorized, onMessage, pending],
  );

  return {
    isAvailable:
      social !== null &&
      social.isAvailable &&
      (social.friends?.length ?? 0) > 0,
    friends: social?.friends ?? null,
    pending,
    open: setPending,
    close: useCallback(() => setPending(null), []),
    sendTo,
  };
}
