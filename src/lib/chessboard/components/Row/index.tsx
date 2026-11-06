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
  coordinates?: boolean;
  onSquarePress?: (square: SquareName) => void;
}

const Row: React.FC<RowProps> = ({
  colors,
  rank,
  orientation = 'w',
  coordinates = true,
  onSquarePress = () => {},
}) => {
  return (
    <View style={{ ...styles.row }} testID="chessboard-row">
      {new Array(BOARD_SQUARES).fill('').map((_, idx) => {
        const fileIndex = orientation === 'b' ? BOARD_SQUARES - 1 - idx : idx;
        const file = String.fromCharCode(CHAR_CODE_FOR_LETTER_A + fileIndex);
        return (
          // Keyed by where it's drawn, not the square it is: a flipped
          // board's squares are the same colours in the same places, so
          // turning it round re-renders them rather than making 64 anew.
          <Square
            key={idx}
            colors={colors}
            rank={rank}
            file={file}
            orientation={orientation}
            coordinates={coordinates}
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
