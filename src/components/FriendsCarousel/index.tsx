import { FlatList, StyleSheet, View } from 'react-native';

import EmptyState from '../EmptyState';
import SectionHeader from '../SectionHeader';
import FriendCard, { FriendCardProps } from './FriendCard';
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
        <EmptyState
          illustration="friends"
          title="No friends yet"
          message="Your friends will show up here once you connect. Add some to message and challenge them."
          action={{
            label: 'Find friends',
            onPress: onSeeAll,
            testID: 'add-friends-prompt',
          }}
          testID="friends-empty"
        />
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
});
