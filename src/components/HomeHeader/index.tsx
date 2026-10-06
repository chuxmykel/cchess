import { View, Pressable, Text, Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HomeHeaderProps {
  onAvatarPress: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ onAvatarPress }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <Image
        source={require("../../../assets/icon.png")} // FIXME: Change to actual logo when ready.
        style={styles.logo}
      />
      <Pressable
        style={styles.avatar}
        onPress={onAvatarPress}
        testID="avatar-button"
      >
        <Text style={styles.avatarText}>{"\u{1F464}"}</Text>
      </Pressable>
    </View>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#769656",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
  },
});
