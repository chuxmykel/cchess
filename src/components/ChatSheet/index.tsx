import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import BottomSheet from '../BottomSheet';
import EmptyState from '../EmptyState';
import Icon from '../Icon';
import { ACCENT_COLOR, MUTED_COLOR } from '../../constants/colors';
import { MAX_CHAT_MESSAGE_LENGTH } from '../../constants/chat';
import { ChatMessage } from '../../network/socketEvents';

const SHEET_HEIGHT_RATIO = 0.8;

interface ChatSheetProps {
  visible: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  myUserId: string;
  onSend: (text: string) => void;
  /** No more messages can be sent; the history stays readable. */
  isClosed?: boolean;
}

const ChatSheet: React.FC<ChatSheetProps> = ({
  visible,
  onClose,
  messages,
  myUserId,
  onSend,
  isClosed = false,
}) => {
  const [draft, setDraft] = useState('');
  const messagesRef = useRef<ScrollViewInstance>(null);
  const canSend = draft.trim().length > 0;

  function send() {
    if (!canSend) return;
    onSend(draft);
    setDraft('');
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      heightRatio={SHEET_HEIGHT_RATIO}
    >
      <View style={styles.container} testID="chat-sheet">
        <Text style={styles.title}>Chat</Text>
        <ScrollView
          ref={messagesRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() =>
            messagesRef.current?.scrollToEnd({ animated: true })
          }
          // The list shrinks when the keyboard comes up - keep the newest
          // messages in view above it.
          onLayout={() => messagesRef.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <EmptyState
              illustration="messages"
              title="No messages yet"
              message={
                isClosed
                  ? 'Nobody chatted during this game.'
                  : 'Say hello to your opponent!'
              }
              compact
              testID="chat-empty"
            />
          ) : (
            messages.map((message) => {
              const isMine = message.userId === myUserId;
              return (
                <View
                  key={message.id}
                  style={[styles.bubble, isMine ? styles.mine : styles.theirs]}
                  testID={`chat-message-${message.id}`}
                >
                  <Text style={isMine ? styles.mineText : styles.theirsText}>
                    {message.text}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
        {isClosed ? (
          <Text style={styles.closed} testID="chat-closed">
            Chat is closed for this game
          </Text>
        ) : (
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={send}
              placeholder="Message"
              maxLength={MAX_CHAT_MESSAGE_LENGTH}
              returnKeyType="send"
              submitBehavior="submit"
              testID="chat-input"
            />
            <Pressable
              onPress={send}
              disabled={!canSend}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Send"
              accessibilityState={{ disabled: !canSend }}
              testID="chat-send-button"
            >
              <Icon
                name="send"
                size={24}
                color={canSend ? ACCENT_COLOR : '#c4c4c4'}
              />
            </Pressable>
          </View>
        )}
      </View>
    </BottomSheet>
  );
};

export default ChatSheet;

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 12,
  },
  container: {
    flex: 1,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    gap: 6,
    paddingBottom: 8,
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
    color: '#fff',
    fontSize: 15,
  },
  theirsText: {
    color: '#222',
    fontSize: 15,
  },
  closed: {
    marginTop: 8,
    paddingVertical: 10,
    textAlign: 'center',
    color: MUTED_COLOR,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
    fontSize: 15,
  },
});
