import { Pressable, StyleSheet, Text, View } from 'react-native';

import Avatar from '../../Avatar';
import Icon from '../../Icon';
import PopoverMenu from '../../PopoverMenu';
import { ACCENT_COLOR, MUTED_COLOR } from '../../../constants/colors';
import { Friend } from '../../../network/restClient';
import { presenceLabel } from '../../../utils/presence';

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
          <Icon name="message-text" size={12} color="white" />
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
          <Icon name="television-play" size={18} color={ACCENT_COLOR} />
        </Pressable>
      )}
    </Pressable>
  );
};

export default FriendCard;

const styles = StyleSheet.create({
  card: {
    width: 120,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
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
    borderColor: '#f0f0f0',
    backgroundColor: ACCENT_COLOR,
  },
  name: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  status: {
    marginTop: 2,
    fontSize: 11,
    color: MUTED_COLOR,
    textAlign: 'center',
  },
  unread: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: '#d33',
  },
  unreadText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  watch: {
    marginTop: 6,
  },
});
