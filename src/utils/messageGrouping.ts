import { isSameDay, parseISO } from 'date-fns';

import { messageDayLabel } from './messageTime';

/** Messages from one person this close together read as one group. */
export const MESSAGE_GROUP_GAP_MS = 5 * 60 * 1000;

/** A message that's only this many emoji, or fewer, is drawn large. */
const MAX_BIG_EMOJI = 3;

/** What a message needs for a list to lay it out. */
export type GroupableMessage = {
  senderId: string;
  createdAt: string;
};

export type MessageListItem<Message extends GroupableMessage> =
  | { kind: 'day'; key: string; label: string }
  | {
      kind: 'message';
      message: Message;
      /** The one before it is the same person's, moments earlier. */
      continuesGroup: boolean;
      /** The last of its group: the time is shown under it. */
      endsGroup: boolean;
      /** Your newest message, once they've read it. */
      seen: boolean;
    };

/** Whether `message` carries on `previous`'s group - neither missing. */
function joinsGroup(
  previous: GroupableMessage | undefined,
  message: GroupableMessage | undefined,
): boolean {
  if (!previous || !message || previous.senderId !== message.senderId) {
    return false;
  }
  const before = parseISO(previous.createdAt);
  const at = parseISO(message.createdAt);
  return (
    isSameDay(before, at) &&
    at.getTime() - before.getTime() <= MESSAGE_GROUP_GAP_MS
  );
}

/**
 * A conversation's messages, oldest first, as a list lays them out: a
 * separator before each day's first, each message grouped with the same
 * person's just before and after it, and "seen" on your newest message
 * once the other person's read up to it.
 */
export function messageListItems<Message extends GroupableMessage>(
  messages: Message[],
  myUserId: string,
  theirLastReadAt: string | null,
  now: Date,
): MessageListItem<Message>[] {
  let myNewest = -1;
  messages.forEach((message, index) => {
    if (message.senderId === myUserId) myNewest = index;
  });
  const readUpTo = theirLastReadAt ? parseISO(theirLastReadAt).getTime() : null;

  const items: MessageListItem<Message>[] = [];
  messages.forEach((message, index) => {
    const previous = messages[index - 1];
    if (
      !previous ||
      !isSameDay(parseISO(previous.createdAt), parseISO(message.createdAt))
    ) {
      items.push({
        kind: 'day',
        key: `day-${message.createdAt}`,
        label: messageDayLabel(message.createdAt, now),
      });
    }
    items.push({
      kind: 'message',
      message,
      continuesGroup: joinsGroup(previous, message),
      endsGroup: !joinsGroup(message, messages[index + 1]),
      seen:
        index === myNewest &&
        readUpTo !== null &&
        parseISO(message.createdAt).getTime() <= readUpTo,
    });
  });
  return items;
}

// Built once; null where the JS engine can't do Unicode property escapes,
// and then no message counts as only emoji.
const EMOJI_ONLY = (() => {
  try {
    return new RegExp(
      '^(?:\\p{Extended_Pictographic}(?:\\uFE0F|\\p{Emoji_Modifier})?(?:\\u200D\\p{Extended_Pictographic}(?:\\uFE0F|\\p{Emoji_Modifier})?)*|\\p{Regional_Indicator}{2}|\\s)+$',
      'u',
    );
  } catch {
    return null;
  }
})();
const EMOJI = (() => {
  try {
    return new RegExp(
      '\\p{Extended_Pictographic}(?:\\uFE0F|\\p{Emoji_Modifier})?(?:\\u200D\\p{Extended_Pictographic}(?:\\uFE0F|\\p{Emoji_Modifier})?)*|\\p{Regional_Indicator}{2}',
      'gu',
    );
  } catch {
    return null;
  }
})();

/** True for a message that's only an emoji or a few - "👍", "😂😂" - so a
 * list can draw it large, without a bubble. */
export function isBigEmoji(text: string): boolean {
  if (!EMOJI_ONLY || !EMOJI || !text.trim() || !EMOJI_ONLY.test(text)) {
    return false;
  }
  return (text.match(EMOJI)?.length ?? 0) <= MAX_BIG_EMOJI;
}
