import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  Text,
  TextInput,
  View,
} from 'react-native';

import BottomSheet from '../BottomSheet';
import EmptyState from '../EmptyState';
import Icon from '../Icon';
import { MAX_CHAT_MESSAGE_LENGTH } from '../../constants/chat';
import { GameChat } from '../../hooks/useGameChat';
import { ChatMessage, GameUserSummary } from '../../network/socketEvents';
import { makeStyles, useTheme } from '../../theme';

const SHEET_HEIGHT_RATIO = 0.8;

const NOTE_VERBS: Record<Exclude<ChatMessage['kind'], 'message'>, string> = {
  'draw-offered': 'offered a draw',
  'draw-declined': 'declined the draw',
  'draw-accepted': 'accepted the draw',
};

/** "You offered a draw", "Judit declined the draw". */
function noteText(
  message: ChatMessage,
  myUserId: string,
  players: GameUserSummary[],
): string {
  const who =
    message.userId === myUserId
      ? 'You'
      : (players.find((player) => player.id === message.userId)?.displayName ??
        'Your opponent');
  return `${who} ${NOTE_VERBS[message.kind as keyof typeof NOTE_VERBS]}`;
}

interface ChatSheetProps {
  chat: GameChat;
  /** The game's players, named in the notes of what they did. */
  players: GameUserSummary[];
}

const ChatSheet: React.FC<ChatSheetProps> = ({ chat, players }) => {
  const styles = useStyles();
  const { colors } = useTheme();

  const { messages, myUserId, isClosed } = chat;
  const [draft, setDraft] = useState('');
  const messagesRef = useRef<ScrollViewInstance>(null);
  const canSend = draft.trim().length > 0;

  function send() {
    if (!canSend) return;
    chat.send(draft);
    setDraft('');
  }

  return (
    <BottomSheet
      visible={chat.isOpen}
      onClose={chat.close}
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
              if (message.kind !== 'message') {
                return (
                  <Text
                    key={message.id}
                    style={styles.notice}
                    testID={`chat-notice-${message.id}`}
                  >
                    {noteText(message, myUserId, players)}
                  </Text>
                );
              }
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
                color={canSend ? colors.accent : colors.disabled}
              />
            </Pressable>
          </View>
        )}
      </View>
    </BottomSheet>
  );
};

export default ChatSheet;

const useStyles = makeStyles((t) => ({
  title: {
    color: t.colors.text,
    fontSize: t.fontSize.xxl,
    fontWeight: t.fontWeight.bold,
    marginTop: t.spacing.xs,
    marginBottom: t.spacing.md,
  },
  container: {
    flex: 1,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    gap: t.spacing.sm,
    paddingBottom: t.spacing.sm,
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
  // A line from the game, not a player: faint, between the bubbles.
  notice: {
    alignSelf: 'center',
    paddingVertical: t.spacing.xxs,
    fontSize: t.fontSize.md,
    color: t.colors.textFaint,
  },
  closed: {
    marginTop: t.spacing.sm,
    paddingVertical: t.spacing.md,
    textAlign: 'center',
    color: t.colors.textMuted,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    marginTop: t.spacing.sm,
  },
  input: {
    color: t.colors.text,
    flex: 1,
    paddingVertical: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
    borderRadius: t.radius.xl,
    backgroundColor: t.colors.surface,
    fontSize: t.fontSize.lg,
  },
}));
