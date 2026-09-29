import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";


const Square = ({ color, textColor, rank, file, onPress = () => {} }) => (
  <Pressable
    onPress={onPress}
    testID={`square-${file}${rank}`}
    style={{
      backgroundColor: color,
      ...styles.square,
    }}
  >
    <View
      style={styles.coordinateContainer}
    >
      <View>
        <Text
          style={{
            ...styles.coordinateText,
            color: textColor,
            display: `${file === "a" ? "flex" : "none"}`
          }}
        >
          {rank}
        </Text >
      </View>
      <View style={styles.file}>
        <Text
          style={{
            ...styles.coordinateText,
            color: textColor,
            display: `${rank === 1 ? "flex" : "none"}`
          }}
        >
          {file}
        </Text >
      </View>
    </View>
  </Pressable>
);

export default Square;

const styles = StyleSheet.create({
  square: {
    flex: 1,
  },
  coordinateContainer: {
    padding: 4,
    flex: 1,
    justifyContent: "space-between",
  },
  coordinateText: {
    fontSize: 12,
  },
  file: {
    alignItems: "flex-end"
  }
});

