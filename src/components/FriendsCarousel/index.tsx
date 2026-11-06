import { FlatList, StyleSheet, View } from 'react-native';

import EmptyState from '../EmptyState';
import SectionHeader from '../SectionHeader';
import Placeholder from '../Placeholder';
import FriendCard, {
  FRIEND_AVATAR_SIZE,
  FriendCardProps,
  useFriendCardStyles,
} from './FriendCard';
import { Friend } from '../../network/restClient';
import { byPresence } from '../../utils/presence';
import { spacing } from '../../theme';

type FriendActions = Omit<FriendCardProps, 'friend' | 'unreadCount'>;

interface FriendsCarouselProps extends FriendActions {
  /** Null while they're loading. */
  friends: Friend[] | null;
  unreadByUserId: Record<string, number>;
  onSeeAll: () => void;
  /** The empty state's way to go looking for friends. */
  onFindFriends: () => void;
}

const LOADING_CARD_COUNT = 3;

// Cards shaped as a friend's are - the avatar, the name and what they're
// up to - while the friends load.
const LoadingCards: React.FC = () => {
  const cardStyles = useFriendCardStyles();
  return (
    <View style={[styles.list, styles.loadingCards]} testID="friends-loading">
      {Array.from({ length: LOADING_CARD_COUNT }, (_, index) => (
        <View key={index} style={[cardStyles.card, styles.loadingCard]}>
          <Placeholder
            width={FRIEND_AVATAR_SIZE}
            height={FRIEND_AVATAR_SIZE}
            borderRadius={FRIEND_AVATAR_SIZE / 2}
          />
          <Placeholder width="75%" height={14} />
          <Placeholder width="60%" height={10} />
        </View>
      ))}
    </View>
  );
};

const FriendsCarousel: React.FC<FriendsCarouselProps> = ({
  friends,
  unreadByUserId,
  onSeeAll,
  onFindFriends,
  ...actions
}) => {
  return (
    <View style={styles.container}>
      <SectionHeader
        title="Friends"
        actionLabel="See All"
        onActionPress={onSeeAll}
        testID="friends-see-all"
      />
      {friends === null ? (
        <LoadingCards />
      ) : friends.length === 0 ? (
        <EmptyState
          illustration="friends"
          title="No friends yet"
          message="Your friends will show up here once you connect. Add some to message and challenge them."
          action={{
            label: 'Find friends',
            onPress: onFindFriends,
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
    paddingTop: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  separator: {
    width: 12,
  },
  loadingCards: {
    flexDirection: 'row',
    gap: 12,
  },
  loadingCard: {
    gap: spacing.sm,
  },
});
