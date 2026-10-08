import { View, FlatList, StyleSheet } from 'react-native';

import SectionHeader from '../SectionHeader';
import FriendCard from './FriendCard';
import { FRIENDS, Friend } from '../../constants/friends';

const FriendsCarousel: React.FC = () => {
  function handleFriendPress(friend: Friend) {
    // TODO: decide what tapping a friend card should do.
  }

  function handleSeeAll() {
    // TODO: navigate to a full friends list once it exists.
  }

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Friends"
        actionLabel="See All"
        onActionPress={handleSeeAll}
        testID="friends-see-all"
      />
      <FlatList
        data={FRIENDS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(friend) => friend.id}
        renderItem={({ item }) => (
          <FriendCard friend={item} onPress={handleFriendPress} />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
