import { View, Text, StyleSheet } from "react-native";

const Coordinates = ({ rank, file, color }) => {
  return (
    <View
      style={styles.coordinateContainer}
    >

      <View>
        <Text
          style={{
            ...styles.coordinateText,
            color,
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
            color,
            display: `${rank === 1 ? "flex" : "none"}`
          }}
        >
          {file}
        </Text >
      </View>

    </View>
  );
};

export default Coordinates;


const styles = StyleSheet.create({
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

