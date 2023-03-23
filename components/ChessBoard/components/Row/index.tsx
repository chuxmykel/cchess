import { View, StyleSheet } from "react-native";

import Square from '../Square';

const NUMBER_OF_COLUMNS = 8;

const Row = ({ colors, rank }) => {
  const startColor = rank % 2 === 0 ? colors.light : colors.dark;
  const alternateColor = startColor === colors.light ? colors.dark : colors.light;
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

  return (
    <View style={{ ...styles.row }} testID="chessboard-row">
      {
        new Array(NUMBER_OF_COLUMNS)
          .fill("")
          .map((_square, idx) => {
            return (
              <Square
                key={idx}
                color={idx % 2 === 0 ? startColor : alternateColor}
                textColor={idx % 2 === 0 ? alternateColor : startColor}
                rank={rank}
                file={files[idx]}
              />
            );
          })
      }
    </View>
  );
}

export default Row;

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: "row",
  },
});

