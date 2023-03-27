import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  Square,
  PieceSymbol,
  Color,
  Chess
} from "chess.js";

import Row from './components/Row';
import Piece from './components/Piece';

type SquareDetails = ({
  square: Square;
  type: PieceSymbol;
  color: Color;
} | null);

interface ChessboardProps {
  game: Chess;
  colors: {
    light: string;
    dark: string;
  };
  width: number;
};


const Chessboard: React.FC<ChessboardProps> = ({ game, colors, width, onTurn }) => {
  const [board, setBoard] = useState<SquareDetails[][]>(game.board());
  const NUMBER_OF_ROWS = board.length;
  const PIECE_WIDTH = width / NUMBER_OF_ROWS;

  // Random game demo
  // useEffect(() => {
  //   if (!game.isGameOver()) {
  //     const legalMoves = game.moves();
  //     game.move(legalMoves[Math.floor(Math.random() * legalMoves.length)]);
  //     setTimeout(handleTurn, 0);
  //   }
  // }, [game.turn(), game.board()]);

  function handleTurn() {
    setBoard(game.board());
  }
  return (
    <View
      style={{ width, height: width }}
      testID="chessboard"
    >
      {/* Board Surface */}
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

      {/* Pieces */}
      <>
        {
          board.map((row, rank: number) => {
            return row.map((square, file: number) => {
              return square ? (
                <Piece
                  key={`${square.square}${square.color}${square.type}`}
                  width={PIECE_WIDTH}
                  position={{
                    x: file * PIECE_WIDTH,
                    y: rank * PIECE_WIDTH,
                  }}
                  id={`${square.color}${square.type}`}
                  game={game}
                  onTurn={handleTurn}
                />
              ) : null;
            });
          })
        }
      </>
    </View>
  );
}

export default Chessboard;

