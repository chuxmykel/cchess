import { useMemo } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { Color } from 'chess.js';

import { NUMBER_OF_ROWS, PIECES } from '../../../constants';
import { getXYFromSquare } from '../../../domain/boardCoordinates';
import { piecesFromFen } from '../../../domain/fen';
import BoardSurface from '../BoardSurface';

interface StaticBoardProps {
  fen: string;
  colors: {
    light: string;
    dark: string;
  };
  width: number;
  orientation?: Color;
}

const StaticBoard: React.FC<StaticBoardProps> = ({
  fen,
  colors,
  width,
  orientation = 'w',
}) => {
  const pieces = useMemo(() => piecesFromFen(fen), [fen]);
  const pieceWidth = width / NUMBER_OF_ROWS;

  return (
    <View
      style={{ width, height: width }}
      pointerEvents="none"
      testID="static-chessboard"
    >
      <BoardSurface colors={colors} orientation={orientation} />
      {pieces.map((piece) => {
        const { x, y } = getXYFromSquare(piece.square, pieceWidth, orientation);
        const spriteId = `${piece.color}${piece.type}`;
        return (
          <Image
            key={`${piece.square}-${spriteId}`}
            source={PIECES[spriteId]}
            fadeDuration={0}
            style={[
              styles.piece,
              {
                width: pieceWidth,
                height: pieceWidth,
                transform: [{ translateX: x }, { translateY: y }],
              },
            ]}
            testID={`piece-${piece.square}`}
          />
        );
      })}
    </View>
  );
};

export default StaticBoard;

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
  },
});
