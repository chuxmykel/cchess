import { Pressable, StyleSheet, Text, View } from 'react-native';

import Avatar from '../Avatar';
import GameTypeIcon from '../GameTypeIcon';
import PopoverMenu, { PopoverMenuItem } from '../PopoverMenu';
import { ACCENT_COLOR, MUTED_COLOR } from '../../constants/colors';
import { Friend } from '../../network/restClient';
import { presenceLabel } from '../../utils/presence';
import { highestRating, formatRating } from '../../utils/rating';

interface FriendRowProps {
  friend: Friend;
  onPress: (friend: Friend) => void;
  menuItems: PopoverMenuItem[];
}

const FriendRow: React.FC<FriendRowProps> = ({
  friend,
  onPress,
  menuItems,
}) => {
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
      <PopoverMenu items={menuItems} testID={`friend-row-menu-${friend.id}`} />
    </Pressable>
  );
};

export default FriendRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: ACCENT_COLOR,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  status: {
    marginTop: 2,
    fontSize: 12,
    color: MUTED_COLOR,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: MUTED_COLOR,
  },
});
