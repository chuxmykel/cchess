import { Pressable, Text, View } from 'react-native';

import Avatar from '../Avatar';
import GameTypeIcon from '../GameTypeIcon';
import PopoverMenu, { PopoverMenuItem } from '../PopoverMenu';
import { Friend } from '../../network/restClient';
import { presenceLabel } from '../../utils/presence';
import { highestRating, formatRating } from '../../utils/rating';
import { makeStyles } from '../../theme';

interface FriendRowProps {
  friend: Friend;
  onPress: (friend: Friend) => void;
  /** What the row's ⋯ offers; no ⋯ without them. */
  menuItems?: PopoverMenuItem[];
}

const FriendRow: React.FC<FriendRowProps> = ({
  friend,
  onPress,
  menuItems,
}) => {
  const styles = useStyles();

  const rating = highestRating(friend.ratings);
  const isAround = friend.online || friend.playingGameId !== null;
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() => onPress(friend)}
      accessibilityRole="button"
      testID={`friend-row-${friend.id}`}
    >
      <View>
        <Avatar
          name={friend.displayName}
          color={friend.avatarColor}
          size={40}
        />
        {isAround && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>
          {friend.displayName}
        </Text>
        <Text style={styles.status} numberOfLines={1}>
          {presenceLabel(friend)}
        </Text>
      </View>
      {rating && (
        <View style={styles.rating}>
          <GameTypeIcon type={rating.category} size={14} />
          <Text style={styles.ratingText}>
            {formatRating(rating.rating, rating.provisional)}
          </Text>
        </View>
      )}
      {menuItems && (
        <PopoverMenu
          items={menuItems}
          testID={`friend-row-menu-${friend.id}`}
        />
      )}
    </Pressable>
  );
};

export default FriendRow;

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 11,
    height: 11,
    borderRadius: t.radius.sm,
    borderWidth: 2,
    borderColor: t.colors.background,
    backgroundColor: t.colors.accent,
  },
  details: {
    flex: 1,
  },
  name: {
    color: t.colors.text,
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.semibold,
  },
  status: {
    marginTop: t.spacing.xxs,
    fontSize: t.fontSize.sm,
    color: t.colors.textMuted,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
  },
  ratingText: {
    fontSize: t.fontSize.md,
    color: t.colors.textMuted,
  },
}));
