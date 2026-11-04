import { Pressable, Text, View } from 'react-native';

import Avatar from '../../Avatar';
import Icon from '../../Icon';
import PopoverMenu from '../../PopoverMenu';
import { Friend } from '../../../network/restClient';
import { presenceLabel } from '../../../utils/presence';
import { makeStyles, useTheme } from '../../../theme';

export interface FriendCardProps {
  friend: Friend;
  unreadCount: number;
  onPress: (friend: Friend) => void;
  onMessage: (friend: Friend) => void;
  onChallenge: (friend: Friend) => void;
  onWatch: (friend: Friend, gameId: string) => void;
}

const FriendCard: React.FC<FriendCardProps> = ({
  friend,
  unreadCount,
  onPress,
  onMessage,
  onChallenge,
  onWatch,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();

  const { playingGameId } = friend;
  return (
    <Pressable
      style={styles.card}
      onPress={() => onPress(friend)}
      accessibilityRole="button"
      accessibilityLabel={`${friend.displayName}, ${presenceLabel(friend)}`}
      testID={`friend-card-${friend.id}`}
    >
      <PopoverMenu
        items={[
          {
            label: 'Message',
            icon: 'message-outline',
            onPress: () => onMessage(friend),
            testID: `friend-message-${friend.id}`,
          },
          {
            label: 'Challenge',
            icon: 'sword-cross',
            onPress: () => onChallenge(friend),
            testID: `friend-challenge-${friend.id}`,
          },
        ]}
        style={styles.menuButton}
        testID={`friend-menu-button-${friend.id}`}
      />
      <View>
        <Avatar
          name={friend.displayName}
          color={friend.avatarColor}
          size={48}
        />
        {(friend.online || playingGameId) && (
          <View
            style={styles.onlineDot}
            testID={`friend-online-${friend.id}`}
          />
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {friend.displayName}
      </Text>
      <Text style={styles.status} numberOfLines={1}>
        {presenceLabel(friend)}
      </Text>
      {unreadCount > 0 && (
        <View style={styles.unread} testID={`friend-unread-${friend.id}`}>
          <Icon name="message-text" size={12} color={colors.textOnAccent} />
          <Text style={styles.unreadText}>{unreadCount}</Text>
        </View>
      )}
      {playingGameId && (
        <Pressable
          style={styles.watch}
          onPress={() => onWatch(friend, playingGameId)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Watch ${friend.displayName}'s game`}
          testID={`friend-watch-${friend.id}`}
        >
          <Icon name="television-play" size={18} color={colors.accent} />
        </Pressable>
      )}
    </Pressable>
  );
};

export default FriendCard;

const useStyles = makeStyles((t) => ({
  card: {
    width: 120,
    padding: t.spacing.md,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
    alignItems: 'center',
    ...t.elevation.sm,
    shadowColor: t.colors.shadow,
  },
  menuButton: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: t.colors.surface,
    backgroundColor: t.colors.accent,
  },
  name: {
    marginTop: t.spacing.sm,
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.semibold,
    textAlign: 'center',
  },
  status: {
    marginTop: t.spacing.xxs,
    fontSize: t.fontSize.xs,
    color: t.colors.textMuted,
    textAlign: 'center',
  },
  unread: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xxs,
    paddingHorizontal: t.spacing.xs,
    paddingVertical: 1,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.badge,
  },
  unreadText: {
    color: t.colors.textOnAccent,
    fontSize: t.fontSize.xs,
    fontWeight: t.fontWeight.bold,
  },
  watch: {
    marginTop: t.spacing.sm,
  },
}));
