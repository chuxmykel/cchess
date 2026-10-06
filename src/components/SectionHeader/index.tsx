import { View, Text, Pressable, StyleSheet } from "react-native";

interface SectionHeaderProps {
  title: string;
  actionLabel: string;
  onActionPress: () => void;
  testID?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  onActionPress,
  testID,
}) => {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      <Pressable onPress={onActionPress} testID={testID}>
        <Text style={styles.action}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
};

export default SectionHeader;

const styles = StyleSheet.create({
  row: {
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
  action: {
    color: "#769656",
    fontWeight: "600",
  },
});
