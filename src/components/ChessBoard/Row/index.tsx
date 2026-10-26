import { View, StyleSheet } from 'react-native';
import { Color } from 'chess.js';

import { NUMBER_OF_COLUMNS, CHAR_CODE_FOR_LETTER_A } from '../../../constants';
import Square from '../Square';

interface RowProps {
  colors: {
    light: string;
    dark: string;
  };
  rank: number;
  orientation?: Color;
  onSquarePress?: (square: string) => void;
}

const Row: React.FC<RowProps> = ({
  colors,
  rank,
  orientation = 'w',
  onSquarePress = (_square: string) => {},
}) => {
  return (
    <View style={{ ...styles.row }} testID="chessboard-row">
      {new Array(NUMBER_OF_COLUMNS).fill('').map((_, idx) => {
        const fileIndex =
          orientation === 'b' ? NUMBER_OF_COLUMNS - 1 - idx : idx;
        const file = String.fromCharCode(CHAR_CODE_FOR_LETTER_A + fileIndex);
        return (
          <Square
            key={`${file}${rank}`}
            colors={colors}
            rank={rank}
            file={file}
            orientation={orientation}
            onPress={() => onSquarePress(`${file}${rank}`)}
          />
        );
      })}
    </View>
  );
};

export default Row;

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
  },
});
