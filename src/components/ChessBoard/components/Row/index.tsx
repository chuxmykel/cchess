import { View, StyleSheet } from "react-native";

import {
  NUMBER_OF_COLUMNS,
  CHAR_CODE_FOR_LETTER_A
} from "../../../../constants";
import Square from '../Square';


const Row = ({ colors, rank }) => {
  const startColor = rank % 2 === 0 ? colors.light : colors.dark;
  const alternateColor = startColor === colors.light ? colors.dark : colors.light;

  return (
    <View style={{ ...styles.row }} testID="chessboard-row">
      {
        new Array(NUMBER_OF_COLUMNS)
          .fill("")
          .map((_, idx) => {
            const file = String.fromCharCode(CHAR_CODE_FOR_LETTER_A + idx);
            return (
              <Square
                key={`${file}${rank}`}
                color={idx % 2 === 0 ? startColor : alternateColor}
                textColor={idx % 2 === 0 ? alternateColor : startColor}
                rank={rank}
                file={file}
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

