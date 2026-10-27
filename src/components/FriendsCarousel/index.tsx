import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import Icon from '../Icon';
import SectionHeader from '../SectionHeader';
import FriendCard, { FriendCardProps } from './FriendCard';
import { ACCENT_COLOR, MUTED_COLOR } from '../../constants/colors';
import { Friend } from '../../network/restClient';
import { byPresence } from '../../utils/presence';

type FriendActions = Omit<FriendCardProps, 'friend' | 'unreadCount'>;

interface FriendsCarouselProps extends FriendActions {
  /** Null while they're loading. */
  friends: Friend[] | null;
  unreadByUserId: Record<string, number>;
  onSeeAll: () => void;
}

const FriendsCarousel: React.FC<FriendsCarouselProps> = ({
  friends,
  unreadByUserId,
  onSeeAll,
  ...actions
}) => {
  if (friends === null) {
    return null;
  }

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Friends"
        actionLabel="See All"
        onActionPress={onSeeAll}
        testID="friends-see-all"
      />
      {friends.length === 0 ? (
        <Pressable
          style={styles.empty}
          onPress={onSeeAll}
          accessibilityRole="button"
          testID="add-friends-prompt"
        >
          <Icon name="account-plus-outline" size={24} color={ACCENT_COLOR} />
          <Text style={styles.emptyText}>
            Add friends to message and challenge them.
          </Text>
        </Pressable>
      ) : (
        <FlatList
          data={[...friends].sort(byPresence)}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(friend) => friend.id}
          renderItem={({ item }) => (
            <FriendCard
              friend={item}
              unreadCount={unreadByUserId[item.id] ?? 0}
              {...actions}
            />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
};

export default FriendsCarousel;

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  separator: {
    width: 12,
  },
  empty: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    flex: 1,
    fontSize: 14,
    color: MUTED_COLOR,
  },
});
