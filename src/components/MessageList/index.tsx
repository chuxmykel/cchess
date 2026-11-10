import { useMemo, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  Text,
  View,
} from 'react-native';

import Button from '../Button';
import EmptyState from '../EmptyState';
import Icon from '../Icon';
import MessageAttachmentCard from '../MessageAttachmentCard';
import TypingIndicator from '../TypingIndicator';
import { ShownMessage } from '../../hooks/useDirectMessages';
import { isBigEmoji, messageListItems } from '../../utils/messageGrouping';
import { messageClockTime } from '../../utils/messageTime';
import { makeStyles, useTheme } from '../../theme';

interface MessageListProps {
  /** Oldest first. */
  messages: ShownMessage[];
  myUserId: string;
  /** Who the conversation is with, for the empty state. */
  otherName: string;
  hasOlder: boolean;
  onLoadOlder: () => void;
  /** When they last read your messages, for "Seen". */
  theirLastReadAt?: string | null;
  /** They're typing to you. */
  isTyping?: boolean;
  onRetry?: (messageId: string) => void;
  onOpenGame?: (gameId: string) => void;
  onOpenPosition?: (fen: string) => void;
  /** For "today" and "yesterday" - now, unless a test says. */
  now?: Date;
}

const noop = () => {};

const MessageList: React.FC<MessageListProps> = ({
  messages,
  myUserId,
  otherName,
  hasOlder,
  onLoadOlder,
  theirLastReadAt = null,
  isTyping = false,
  onRetry = noop,
  onOpenGame = noop,
  onOpenPosition = noop,
  now,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const items = useMemo(
    () =>
      messageListItems(messages, myUserId, theirLastReadAt, now ?? new Date()),
    [messages, myUserId, theirLastReadAt, now],
  );

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.list}
      contentContainerStyle={styles.content}
      onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
      keyboardDismissMode="interactive"
      testID="message-list"
    >
      {hasOlder && (
        <Button
          label="Earlier messages"
          variant="text"
          onPress={onLoadOlder}
          testID="load-older-messages"
        />
      )}
      {messages.length === 0 && !isTyping && (
        <EmptyState
          illustration="messages"
          title="No messages yet"
          message={`Say hello to ${otherName}! Your conversation will show up here.`}
          testID="messages-empty"
        />
      )}
      {items.map((item) => {
        if (item.kind === 'day') {
          return (
            <Text key={item.key} style={styles.day}>
              {item.label}
            </Text>
          );
        }
        const { message, continuesGroup, endsGroup, seen } = item;
        const isMine = message.senderId === myUserId;
        const bigEmoji = !message.attachment && isBigEmoji(message.text);
        const failed = message.delivery === 'failed';
        return (
          <View
            key={message.id}
            style={[
              styles.message,
              isMine ? styles.mineSide : styles.theirsSide,
              continuesGroup && styles.continuesGroup,
              message.delivery === 'sending' && styles.sending,
            ]}
            testID={`message-${message.id}`}
          >
            {message.attachment && (
              <MessageAttachmentCard
                attachment={message.attachment}
                onOpenGame={onOpenGame}
                onOpenPosition={onOpenPosition}
                testID={`message-${message.id}-attachment`}
              />
            )}
            {bigEmoji ? (
              <Text style={styles.bigEmoji}>{message.text}</Text>
            ) : (
              message.text !== '' && (
                <View
                  style={[
                    styles.bubble,
                    isMine ? styles.mine : styles.theirs,
                    failed && styles.failedBubble,
                    // The corner nearest the next message of theirs is
                    // tucked in, so a group reads as one.
                    !endsGroup &&
                      (isMine ? styles.mineTucked : styles.theirsTucked),
                  ]}
                >
                  <Text style={isMine ? styles.mineText : styles.theirsText}>
                    {message.text}
                  </Text>
                </View>
              )
            )}
            {failed ? (
              <Pressable
                onPress={() => onRetry(message.id)}
                hitSlop={8}
                style={styles.status}
                accessibilityRole="button"
                accessibilityLabel="Not sent. Tap to retry"
                testID={`message-${message.id}-retry`}
              >
                <Icon
                  name="alert-circle-outline"
                  size={14}
                  color={colors.danger}
                />
                <Text style={styles.failedText}>Not sent · Tap to retry</Text>
              </Pressable>
            ) : (
              (endsGroup || seen || message.delivery === 'sending') && (
                <View style={styles.status}>
                  {message.delivery === 'sending' ? (
                    <>
                      <Icon
                        name="clock-outline"
                        size={12}
                        color={colors.textMuted}
                      />
                      <Text style={styles.time}>Sending…</Text>
                    </>
                  ) : (
                    <>
                      {endsGroup && (
                        <Text style={styles.time}>
                          {messageClockTime(message.createdAt)}
                        </Text>
                      )}
                      {seen && (
                        <View
                          style={styles.seen}
                          testID={`message-${message.id}-seen`}
                        >
                          <Icon
                            name="check-all"
                            size={14}
                            color={colors.accent}
                          />
                          <Text style={styles.seenText}>Seen</Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              )
            )}
          </View>
        );
      })}
      {isTyping && <TypingIndicator name={otherName} />}
    </ScrollView>
  );
};

export default MessageList;

const useStyles = makeStyles((t) => ({
  list: {
    flex: 1,
  },
  content: {
    gap: t.spacing.sm,
    padding: t.spacing.lg,
  },
  day: {
    alignSelf: 'center',
    marginVertical: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.xs,
    borderRadius: t.radius.md,
    overflow: 'hidden',
    backgroundColor: t.colors.surfaceStrong,
    fontSize: t.fontSize.sm,
    color: t.colors.textMuted,
  },
  message: {
    maxWidth: '80%',
    gap: t.spacing.xs,
  },
  mineSide: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  theirsSide: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  continuesGroup: {
    // Closer to the one before it than the gap between groups.
    marginTop: -t.spacing.xs,
  },
  sending: {
    opacity: 0.6,
  },
  bubble: {
    paddingVertical: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radius.lg,
  },
  mine: {
    backgroundColor: t.colors.accent,
  },
  theirs: {
    backgroundColor: t.colors.surfaceStrong,
  },
  mineTucked: {
    borderBottomRightRadius: t.radius.sm,
  },
  theirsTucked: {
    borderBottomLeftRadius: t.radius.sm,
  },
  failedBubble: {
    opacity: 0.6,
  },
  mineText: {
    color: t.colors.textOnAccent,
    fontSize: t.fontSize.lg,
  },
  theirsText: {
    color: t.colors.text,
    fontSize: t.fontSize.lg,
  },
  bigEmoji: {
    fontSize: 44,
    lineHeight: 52,
    color: t.colors.text,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
  },
  time: {
    fontSize: t.fontSize.xxs,
    color: t.colors.textMuted,
  },
  seen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xxs,
  },
  seenText: {
    fontSize: t.fontSize.xxs,
    color: t.colors.accent,
    fontWeight: t.fontWeight.semibold,
  },
  failedText: {
    fontSize: t.fontSize.xs,
    color: t.colors.danger,
  },
}));
