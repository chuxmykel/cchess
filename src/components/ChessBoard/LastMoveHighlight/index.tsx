import { StyleSheet, View } from 'react-native';
import { Color } from 'chess.js';

import { getXYFromSquare } from '../../../domain/boardCoordinates';
import { MoveSquares } from '../../../domain/types';

interface LastMoveHighlightProps {
  move: MoveSquares | null;
  squareWidth: number;
  orientation?: Color;
}

// The last move's two squares, tinted as on lichess: where the piece came
// from and where it went - under the pieces, over the board's squares.
const LastMoveHighlight: React.FC<LastMoveHighlightProps> = ({
  move,
  squareWidth,
  orientation = 'w',
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
              { left: x, top: y, width: squareWidth, height: squareWidth },
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
    backgroundColor: 'rgba(155, 199, 0, 0.41)',
  },
});
