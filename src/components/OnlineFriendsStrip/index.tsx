import { Pressable, ScrollView, Text, View } from 'react-native';

import PresenceAvatar, { presenceOf } from '../PresenceAvatar';
import { Friend } from '../../network/restClient';
import { byPresence } from '../../utils/presence';
import { makeStyles } from '../../theme';

interface OnlineFriendsStripProps {
  friends: Friend[];
  onPress: (friend: Friend) => void;
}

// The friends around right now - in a game first - across the top of the
// inbox, a tap away from a message. Nothing while nobody is.
const OnlineFriendsStrip: React.FC<OnlineFriendsStripProps> = ({
  friends,
  onPress,
}) => {
  const styles = useStyles();
  const around = friends
    .filter((friend) => presenceOf(friend) !== null)
    .sort(byPresence);
  if (around.length === 0) return null;

  return (
    <View style={styles.strip} testID="online-friends">
      <Text style={styles.title}>Online now</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {around.map((friend) => (
          <Pressable
            key={friend.id}
            style={({ pressed }) => [styles.friend, pressed && styles.pressed]}
            onPress={() => onPress(friend)}
            accessibilityRole="button"
            accessibilityLabel={`Message ${friend.displayName}`}
            testID={`online-friend-${friend.id}`}
          >
            <PresenceAvatar
              name={friend.displayName}
              color={friend.avatarColor}
              presence={presenceOf(friend)}
              size={56}
            />
            <Text style={styles.name} numberOfLines={1}>
              {friend.displayName.split(' ')[0]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

export default OnlineFriendsStrip;

const FRIEND_WIDTH = 64;

const useStyles = makeStyles((t) => ({
  strip: {
    gap: t.spacing.sm,
    paddingTop: t.spacing.sm,
    paddingBottom: t.spacing.md,
  },
  title: {
    paddingHorizontal: t.spacing.lg,
    color: t.colors.textMuted,
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.semibold,
    textTransform: 'uppercase',
  },
  row: {
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
  },
  friend: {
    width: FRIEND_WIDTH,
    alignItems: 'center',
    gap: t.spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  name: {
    color: t.colors.text,
    fontSize: t.fontSize.sm,
  },
}));
