import { View, StyleSheet } from 'react-native';
import { BOARD_SQUARES, CHAR_CODE_FOR_LETTER_A } from '../../constants';
import { Color, Square as SquareName } from '../../types';
import Square from '../Square';

interface RowProps {
  colors: {
    light: string;
    dark: string;
  };
  rank: number;
  orientation?: Color;
  onSquarePress?: (square: SquareName) => void;
}

const Row: React.FC<RowProps> = ({
  colors,
  rank,
  orientation = 'w',
  onSquarePress = () => {},
}) => {
  return (
    <View style={{ ...styles.row }} testID="chessboard-row">
      {new Array(BOARD_SQUARES).fill('').map((_, idx) => {
        const fileIndex = orientation === 'b' ? BOARD_SQUARES - 1 - idx : idx;
        const file = String.fromCharCode(CHAR_CODE_FOR_LETTER_A + fileIndex);
        return (
          <Square
            key={`${file}${rank}`}
            colors={colors}
            rank={rank}
            file={file}
            orientation={orientation}
            onPress={() => onSquarePress(`${file}${rank}` as SquareName)}
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
