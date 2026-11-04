import { Fragment, useRef } from 'react';
import { ScrollView, type ScrollViewInstance, Text, View } from 'react-native';
import { format, isSameDay, parseISO } from 'date-fns';

import Button from '../Button';
import EmptyState from '../EmptyState';
import { DirectMessage } from '../../network/restClient';
import { makeStyles } from '../../theme';

interface MessageListProps {
  /** Oldest first. */
  messages: DirectMessage[];
  myUserId: string;
  /** Who the conversation is with, for the empty state. */
  otherName: string;
  hasOlder: boolean;
  onLoadOlder: () => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  myUserId,
  otherName,
  hasOlder,
  onLoadOlder,
}) => {
  const styles = useStyles();

  const scrollRef = useRef<ScrollViewInstance>(null);
  return (
    <ScrollView
      ref={scrollRef}
      style={styles.list}
      contentContainerStyle={styles.content}
      onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
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
      {messages.length === 0 && (
        <EmptyState
          illustration="messages"
          title="No messages yet"
          message={`Say hello to ${otherName}! Your conversation will show up here.`}
          testID="messages-empty"
        />
      )}
      {messages.map((message, index) => {
        const sentAt = parseISO(message.createdAt);
        const isNewDay =
          index === 0 ||
          !isSameDay(parseISO(messages[index - 1].createdAt), sentAt);
        const isMine = message.senderId === myUserId;
        return (
          <Fragment key={message.id}>
            {isNewDay && (
              <Text style={styles.day}>{format(sentAt, 'MMM d, yyyy')}</Text>
            )}
            <View
              style={[styles.bubble, isMine ? styles.mine : styles.theirs]}
              testID={`message-${message.id}`}
            >
              <Text style={isMine ? styles.mineText : styles.theirsText}>
                {message.text}
              </Text>
              <Text style={[styles.time, isMine && styles.mineTime]}>
                {format(sentAt, 'HH:mm')}
              </Text>
            </View>
          </Fragment>
        );
      })}
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
  bubble: {
    maxWidth: '80%',
    paddingVertical: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radius.lg,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: t.colors.accent,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: t.colors.surfaceStrong,
  },
  mineText: {
    color: t.colors.textOnAccent,
    fontSize: t.fontSize.lg,
  },
  theirsText: {
    color: t.colors.text,
    fontSize: t.fontSize.lg,
  },
  time: {
    marginTop: t.spacing.xxs,
    alignSelf: 'flex-end',
    fontSize: t.fontSize.xxs,
    color: t.colors.textMuted,
  },
  mineTime: {
    color: t.colors.textOnAccentMuted,
  },
}));
