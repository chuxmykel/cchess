import {
  View,
} from 'react-native';
import Piece from './components/Piece';

import Row from './components/Row';

interface ChessboardProps {
  board: string[][];
  colors: {
    light: string;
    dark: string;
  },
  width: number,
};

const NUMBER_OF_ROWS = 8;

const Chessboard: React.FC<ChessboardProps> = ({ board, colors, width }) => {
  const pieceWidth = width / NUMBER_OF_ROWS;

  return (
    <View
      style={{ width, height: width, }}
      testID="chessboard"
    >
      <>
        {
          new Array(NUMBER_OF_ROWS)
            .fill("")
            .map((_, idx) => (
              <Row
                key={idx}
                colors={colors}
                rank={NUMBER_OF_ROWS - idx}
              />
            ))
        }
      </>

      <>
        {
          board.map((row: any, rank: number) => {
            return row.map((piece: any, file: number) => {
              return piece === " " ? null : (
                <Piece
                  key={`${piece}${file}${rank}`}
                  width={pieceWidth}
                  position={{
                    x: file * pieceWidth,
                    y: rank * pieceWidth,
                  }}
                  id={piece}
                />
              );
            });
          })
        }
      </>
    </View>
  );
}

export default Chessboard;

