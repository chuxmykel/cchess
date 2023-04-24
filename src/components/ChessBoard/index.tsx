import { View, Animated } from "react-native";
import { Chess, Square } from "chess.js";

import { NUMBER_OF_ROWS, squares } from "../../constants";
import { PieceDetails, Position } from "../../types";
import {
  getXYFromSquare,
  getSquareFromXY,
  isSamePosition,
} from "../../utils";

import Row from "./components/Row";
import Piece from "./components/Piece";
import PieceDragAndDropGuide from "./components/PieceDragAndDropGuide";
import ValidMoveIndicator from "./components/ValidMoveIndicator";

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
  const dragGuidePosition = new Animated.ValueXY(initialGuidePosition);
  const dragGuideOpacity = new Animated.Value(1);
  const squareDetails = squares.map(square => {
    return {
      validMoveIndicatorOpacity: new Animated.Value(0),
      notation: square,
    };
  });
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

  function clearValidMovesGuide() {
    squareDetails.forEach(square => square.validMoveIndicatorOpacity.setValue(0));
  }
  function showValidMovesGuide(piecePosition: Position) {
    clearValidMovesGuide();
    const fromSquare = getSquareFromXY(piecePosition, PIECE_WIDTH);
    const legalMoves = game.moves({
      square: fromSquare,
      verbose: true,
    });
    const legalMovesToSquares = legalMoves.map(move => move.to);
    squareDetails.forEach(square => {
      if (legalMovesToSquares.includes(square.notation)) {
        square.validMoveIndicatorOpacity.setValue(1);
      }
    });
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

      {/* Legal moves guide */}
      {squareDetails.map(square => {
        const squarePosition = getXYFromSquare(square.notation, PIECE_WIDTH);
        return (
          <ValidMoveIndicator
            key={square.notation}
            position={squarePosition}
            squareWidth={PIECE_WIDTH}
            opacity={square.validMoveIndicatorOpacity}
          />
        );
      })}

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
                disabled={!isPieceColorTurn || game.isGameOver()}
                opacity={pieceDetails.opacity}
                onMove={onMove}
                onDrag={updateDragGuidePosition}
                showDragGuide={showDragGuide}
                hideDragGuide={hideDragGuide}
                showValidMovesGuide={showValidMovesGuide}
                clearValidMovesGuide={clearValidMovesGuide}
              />
            )
          })
        }
      </>
    </View>
  );
};

export default Chessboard;

