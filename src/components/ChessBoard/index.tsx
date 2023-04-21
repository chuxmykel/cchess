import { View } from "react-native";
import { Chess } from "chess.js";

import { NUMBER_OF_ROWS } from "../../constants";
import { PieceDetails, Position } from "../../types";

import Row from "./components/Row";
import Piece from "./components/Piece";

interface ChessboardProps {
  game: Chess;
  colors: {
    light: string;
    dark: string;
  };
  width: number;
  onMove: (from: Position, to: Position) => void;
  pieces: PieceDetails[];
}

const Chessboard: React.FC<ChessboardProps> = ({
  game,
  colors,
  width,
  onMove,
  pieces
}) => {
  const PIECE_WIDTH = width / NUMBER_OF_ROWS;

  return (
    <View style={{ width, height: width }} testID="chessboard">
      {/* Board Surface */}
      <>
        {new Array(NUMBER_OF_ROWS).fill("").map((_, idx) => (
          <Row key={idx} colors={colors} rank={NUMBER_OF_ROWS - idx} />
        ))}
      </>

      {/* Pieces */}
      <>
        {
          pieces.map((pieceDetails: PieceDetails) => {
            const isPieceColorTurn = game.turn() === pieceDetails.id.charAt(0);
            return pieceDetails.captured ? null : (
              <Piece
                key={pieceDetails.key}
                id={pieceDetails.id}
                width={PIECE_WIDTH}
                position={pieceDetails.position}
                animatedPosition={pieceDetails.animatedPosition}
                onMove={onMove}
                disabled={!isPieceColorTurn || game.isGameOver()}
              />
            )
          })
        }
      </>
    </View >
  );
};

export default Chessboard;

