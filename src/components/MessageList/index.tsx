import { Fragment, useRef } from 'react';
import {
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { format, isSameDay, parseISO } from 'date-fns';

import Button from '../Button';
import EmptyState from '../EmptyState';
import { ACCENT_COLOR, MUTED_COLOR } from '../../constants/colors';
import { DirectMessage } from '../../network/restClient';

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

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    gap: 6,
    padding: 16,
  },
  day: {
    alignSelf: 'center',
    marginVertical: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#eee',
    fontSize: 12,
    color: MUTED_COLOR,
  },
  bubble: {
    maxWidth: '80%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: ACCENT_COLOR,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: '#eee',
  },
  mineText: {
    color: 'white',
    fontSize: 15,
  },
  theirsText: {
    color: '#222',
    fontSize: 15,
  },
  time: {
    marginTop: 2,
    alignSelf: 'flex-end',
    fontSize: 10,
    color: MUTED_COLOR,
  },
  mineTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
