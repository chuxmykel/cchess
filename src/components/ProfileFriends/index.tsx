import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import Avatar from '../Avatar';
import EmptyState from '../EmptyState';
import Icon from '../Icon';
import Placeholder from '../Placeholder';
import SectionHeader from '../SectionHeader';
import { ACCENT_COLOR, MUTED_COLOR } from '../../constants/colors';
import { UserFriend } from '../../network/restClient';
import { sortFriends } from '../../utils/friendSort';
import { presenceLabel } from '../../utils/presence';

export const PROFILE_FRIENDS_SHOWN = 10;
const TILE_WIDTH = 76;

interface ProfileFriendsProps {
  /** How many friends they have, shown beside the title once known. */
  count?: number;
  /** Null while they're loading. */
  friends: UserFriend[] | null;
  emptyMessage: string;
  onSelect: (friend: UserFriend) => void;
  onViewAll: () => void;
  /** Goes looking for friends, from the tile after the last - only on
   * your own profile. */
  onAddFriends?: () => void;
}

// A profile's Friends section: the count, a carousel of the first few -
// online first - ending in a tile to add friends, and View All for the rest.
const ProfileFriends: React.FC<ProfileFriendsProps> = ({
  count,
  friends,
  emptyMessage,
  onSelect,
  onViewAll,
  onAddFriends,
}) => {
  return (
    <View>
      <SectionHeader
        title="Friends"
        count={count}
        actionLabel={count ? 'View All' : undefined}
        onActionPress={onViewAll}
        testID="profile-friends-view-all"
      />
      {friends === null ? (
        <View style={styles.list} testID="profile-friends-loading">
          {[0, 1, 2, 3].map((index) => (
            <View key={index} style={styles.tile}>
              <Placeholder width={56} height={56} />
            </View>
          ))}
        </View>
      ) : friends.length === 0 ? (
        <EmptyState
          illustration="friends"
          title="No friends yet"
          message={emptyMessage}
          action={
            onAddFriends && {
              label: 'Add friends',
              onPress: onAddFriends,
              testID: 'profile-add-friends',
            }
          }
          compact
          testID="profile-friends-empty"
        />
      ) : (
        <FlatList
          data={sortFriends(friends, 'online').slice(0, PROFILE_FRIENDS_SHOWN)}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(friend) => friend.id}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
              onPress={() => onSelect(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.displayName}, ${presenceLabel(item)}`}
              testID={`profile-friend-${item.id}`}
            >
              <View>
                <Avatar
                  name={item.displayName}
                  color={item.avatarColor}
                  size={56}
                />
                {(item.online || item.playingGameId) && (
                  <View
                    style={styles.onlineDot}
                    testID={`profile-friend-online-${item.id}`}
                  />
                )}
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {item.displayName}
              </Text>
            </Pressable>
          )}
          ListFooterComponent={
            onAddFriends && (
              <Pressable
                style={({ pressed }) => [
                  styles.tile,
                  pressed && styles.pressed,
                ]}
                onPress={onAddFriends}
                accessibilityRole="button"
                accessibilityLabel="Add friends"
                testID="profile-add-friends"
              >
                <View style={styles.addCircle}>
                  <Icon
                    name="account-plus-outline"
                    size={26}
                    color={ACCENT_COLOR}
                  />
                </View>
                <Text style={styles.name} numberOfLines={1}>
                  Add friends
                </Text>
              </Pressable>
            )
          }
          contentContainerStyle={styles.list}
          testID="profile-friends"
        />
      )}
    </View>
  );
};

export default ProfileFriends;

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  tile: {
    width: TILE_WIDTH,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: 0.6,
  },
  onlineDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: ACCENT_COLOR,
  },
  addCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: ACCENT_COLOR,
  },
  name: {
    marginTop: 6,
    fontSize: 12,
    color: MUTED_COLOR,
    textAlign: 'center',
  },
});
