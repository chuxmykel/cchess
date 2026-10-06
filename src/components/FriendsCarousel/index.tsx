import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";

import FriendCard from "./FriendCard";
import { FRIENDS, Friend } from "../../constants/friends";

const FriendsCarousel: React.FC = () => {
  function handleFriendPress(friend: Friend) {
    // TODO: decide what tapping a friend card should do.
  }

  function handleSeeAll() {
    // TODO: navigate to a full friends list once it exists.
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Friends</Text>
        <Pressable onPress={handleSeeAll} testID="friends-see-all">
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>
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
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  seeAll: {
    color: "#769656",
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  separator: {
    width: 12,
  },
});
