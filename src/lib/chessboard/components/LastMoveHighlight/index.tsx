import { StyleSheet, View } from 'react-native';

import { getXYFromSquare } from '../../coordinates';
import { Color, MoveSquares } from '../../types';

interface LastMoveHighlightProps {
  move: MoveSquares | null;
  squareWidth: number;
  orientation?: Color;
  color: string;
}

// The last move's two squares, tinted as on lichess: where the piece came
// from and where it went - under the pieces, over the board's squares.
const LastMoveHighlight: React.FC<LastMoveHighlightProps> = ({
  move,
  squareWidth,
  orientation = 'w',
  color,
}) => {
  if (!move) return null;
  return (
    <>
      {(['from', 'to'] as const).map((end) => {
        const { x, y } = getXYFromSquare(move[end], squareWidth, orientation);
        return (
          <View
            key={end}
            pointerEvents="none"
            testID={`last-move-${end}`}
            style={[
              styles.square,
              {
                left: x,
                top: y,
                width: squareWidth,
                height: squareWidth,
                backgroundColor: color,
              },
            ]}
          />
        );
      })}
    </>
  );
};

export default LastMoveHighlight;

const styles = StyleSheet.create({
  square: {
    position: 'absolute',
  },
});
