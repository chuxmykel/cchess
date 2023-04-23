import { useRef } from "react";
import { View, Animated } from "react-native";
import { Chess } from "chess.js";

import { NUMBER_OF_ROWS } from "../../constants";
import { PieceDetails, Position } from "../../types";

import Row from "./components/Row";
import Piece from "./components/Piece";
import PieceDragAndDropGuide from "./components/PieceDragAndDropGuide";

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
  const initialGuidePosition = { x: -PIECE_WIDTH * 3, y: -PIECE_WIDTH * 3 };
  const dragGuidePosition = useRef(new Animated.ValueXY(initialGuidePosition)).current;
  const dragGuideOpacity = useRef(new Animated.Value(1)).current;
  function showDragGuide() {
    dragGuideOpacity.setValue(1);
  }
  function hideDragGuide() {
    dragGuideOpacity.setValue(0);
    dragGuidePosition.setValue(initialGuidePosition);
  }
  function updateDragGuidePosition(currentPieceAnimatedPosition: Position) {
    dragGuidePosition.setValue(currentPieceAnimatedPosition);
  }

  return (
    <View style={{ width, height: width }} testID="chessboard">
      {/* Board Surface */}
      <>
        {new Array(NUMBER_OF_ROWS).fill("").map((_, idx) => (
          <Row key={idx} colors={colors} rank={NUMBER_OF_ROWS - idx} />
        ))}
      </>

      {/* Drag and Drop Guide */}
      <PieceDragAndDropGuide
        squareWidth={PIECE_WIDTH}
        position={dragGuidePosition}
        opacity={dragGuideOpacity}
      />

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
                onDrag={updateDragGuidePosition}
                disabled={!isPieceColorTurn || game.isGameOver()}
                showDragGuide={showDragGuide}
                hideDragGuide={hideDragGuide}
                opacity={pieceDetails.opacity}
              />
            )
          })
        }
      </>
    </View>
  );
};

export default Chessboard;

