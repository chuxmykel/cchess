import { Pressable, Text, View } from 'react-native';

import Icon from '../Icon';
import PresenceAvatar, { Presence } from '../PresenceAvatar';
import { ConversationSummary } from '../../network/restClient';
import { conversationTime } from '../../utils/messageTime';
import { makeStyles, useTheme } from '../../theme';

interface ConversationRowProps {
  conversation: ConversationSummary;
  myUserId: string;
  unreadCount: number;
  presence: Presence;
  /** They're typing to you right now. */
  isTyping: boolean;
  now: Date;
  onPress: (conversation: ConversationSummary) => void;
  onLongPress: (conversation: ConversationSummary) => void;
}

/** What the inbox says of the last message: its text, or what it shared,
 * yours marked "You:". */
export function previewOf(
  conversation: ConversationSummary,
  myUserId: string,
): string {
  const { lastMessage } = conversation;
  const shared =
    lastMessage.attachment?.kind === 'game'
      ? 'Shared a game'
      : lastMessage.attachment?.kind === 'position'
        ? 'Shared a position'
        : null;
  const body = lastMessage.text || shared || '';
  return lastMessage.senderId === myUserId ? `You: ${body}` : body;
}

// One person in the inbox: who, the last message - or that they're typing
// - when, how many are unread, and whether they've seen yours.
const ConversationRow: React.FC<ConversationRowProps> = ({
  conversation,
  myUserId,
  unreadCount,
  presence,
  isTyping,
  now,
  onPress,
  onLongPress,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const { user, lastMessage, theirLastReadAt } = conversation;
  const isMine = lastMessage.senderId === myUserId;
  const isSeen =
    isMine &&
    theirLastReadAt !== null &&
    theirLastReadAt >= lastMessage.createdAt;
  const isUnread = unreadCount > 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() => onPress(conversation)}
      onLongPress={() => onLongPress(conversation)}
      accessibilityRole="button"
      accessibilityLabel={`${user.displayName}${isUnread ? `, ${unreadCount} unread` : ''}`}
      testID={`conversation-${user.id}`}
    >
      <PresenceAvatar
        name={user.displayName}
        color={user.avatarColor}
        presence={presence}
        size={52}
      />
      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text
            style={[styles.name, isUnread && styles.unread]}
            numberOfLines={1}
          >
            {user.displayName}
          </Text>
          <Text style={[styles.time, isUnread && styles.unreadTime]}>
            {conversationTime(lastMessage.createdAt, now)}
          </Text>
        </View>
        <View style={styles.bottomLine}>
          {isTyping ? (
            <Text
              style={styles.typing}
              numberOfLines={1}
              testID={`conversation-${user.id}-typing`}
            >
              typing…
            </Text>
          ) : (
            <View style={styles.previewLine}>
              {isMine && (
                <Icon
                  name={isSeen ? 'check-all' : 'check'}
                  size={16}
                  color={isSeen ? colors.accent : colors.textMuted}
                  testID={`conversation-${user.id}-${isSeen ? 'seen' : 'sent'}`}
                />
              )}
              {lastMessage.attachment && (
                <Icon
                  name={
                    lastMessage.attachment.kind === 'game'
                      ? 'chess-knight'
                      : 'checkerboard'
                  }
                  size={14}
                  color={colors.textMuted}
                />
              )}
              <Text
                style={[styles.preview, isUnread && styles.unreadPreview]}
                numberOfLines={1}
              >
                {previewOf(conversation, myUserId)}
              </Text>
            </View>
          )}
          {isUnread && (
            <View style={styles.unreadBadge}>
              <Text
                style={styles.unreadCount}
                testID={`conversation-${user.id}-unread`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

export default ConversationRow;

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
  },
  pressed: {
    backgroundColor: t.colors.surfaceSubtle,
  },
  body: {
    flex: 1,
    gap: t.spacing.xxs,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: t.spacing.sm,
  },
  name: {
    flex: 1,
    color: t.colors.text,
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.medium,
  },
  unread: {
    fontWeight: t.fontWeight.bold,
  },
  time: {
    color: t.colors.textMuted,
    fontSize: t.fontSize.sm,
  },
  unreadTime: {
    color: t.colors.accentText,
    fontWeight: t.fontWeight.semibold,
  },
  bottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  previewLine: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
  },
  preview: {
    flexShrink: 1,
    color: t.colors.textMuted,
    fontSize: t.fontSize.md,
  },
  unreadPreview: {
    color: t.colors.text,
    fontWeight: t.fontWeight.medium,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: t.spacing.sm,
    borderRadius: t.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.accent,
  },
  unreadCount: {
    color: t.colors.textOnAccent,
    fontSize: t.fontSize.xs,
    fontWeight: t.fontWeight.bold,
  },
  typing: {
    flex: 1,
    color: t.colors.accentText,
    fontSize: t.fontSize.md,
    fontStyle: 'italic',
  },
}));
