import { Text, Pressable, StyleSheet } from "react-native";

import Avatar from "../../Avatar";
import PopoverMenu from "../../PopoverMenu";
import { Friend } from "../../../constants/friends";

interface FriendCardProps {
  friend: Friend;
  onPress: (friend: Friend) => void;
}

const MENU_ITEMS = ["Option 1", "Option 2"]; // TODO: replace with real actions once friend management exists.

const FriendCard: React.FC<FriendCardProps> = ({ friend, onPress }) => {
  function handleSelectMenuItem(item: string) {
    // TODO: wire up real actions.
  }

  return (
    <Pressable
      style={styles.card}
      onPress={() => onPress(friend)}
      testID={`friend-card-${friend.id}`}
    >
      <PopoverMenu
        items={MENU_ITEMS}
        onSelectItem={handleSelectMenuItem}
        style={styles.menuButton}
        testID={`friend-menu-button-${friend.id}`}
      />
      <Avatar name={friend.name} size={48} />
      <Text style={styles.name} numberOfLines={1}>
        {friend.name}
      </Text>
      <Text style={styles.lastActive} numberOfLines={1}>
        {friend.lastActive}
      </Text>
    </Pressable>
  );
};

export default FriendCard;

const styles = StyleSheet.create({
  card: {
    width: 110,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButton: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  name: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  lastActive: {
    marginTop: 2,
    fontSize: 11,
    color: "#888",
    textAlign: "center",
  },
});
