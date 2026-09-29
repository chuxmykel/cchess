import { useRef } from "react";
import { View, Animated } from "react-native";
import { Chess, Square } from "chess.js";

import { NUMBER_OF_ROWS, squares } from "../../constants";
import { PieceDetails, Position } from "../../types";
import { getXYFromSquare, getSquareFromXY } from "../../utils";

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

  // Tap-to-move: tap a square to select it (source), then tap another to move there (target).
  const selectedSquare = useRef<Square | null>(null);
  function isSquareSelected(square: Square): boolean {
    return selectedSquare.current === square;
  }
  function selectSquare(square: Square) {
    selectedSquare.current = square;
  }
  function deselectSquare() {
    selectedSquare.current = null;
    clearValidMovesGuide();
  }
  // Drag-and-drop moves a piece directly via onMove, bypassing handleSquarePress
  // entirely - so a real drag (on any piece, own or not, legal target or not)
  // must still invalidate whatever the tap-to-move flow had armed earlier.
  // Without this, a stale selectedSquare left over from an unresolved tap could
  // cause a later, seemingly unrelated tap to silently move the wrong piece.
  function resetSelectedSquare() {
    selectedSquare.current = null;
  }
  function handleSquarePress(square: Square) {
    if (game.isGameOver()) return;
    const pieceOnSquare = pieces.find(piece => piece.square === square && !piece.captured);
    const isOwnPiece = Boolean(pieceOnSquare) && pieceOnSquare.color === game.turn();

    if (!selectedSquare.current) {
      if (isOwnPiece) selectSquare(square);
      return;
    }
    if (square === selectedSquare.current) {
      return;
    }
    if (isOwnPiece) {
      selectSquare(square);
      return;
    }

    const from = getXYFromSquare(selectedSquare.current, PIECE_WIDTH);
    const to = getXYFromSquare(square, PIECE_WIDTH);
    deselectSquare();
    onMove(from, to);
  }

  return (
    <View style={{ width, height: width }} testID="chessboard">
      {/* Board Surface */}
      <>
        {new Array(NUMBER_OF_ROWS).fill("").map((_, idx) => (
          <Row
            key={idx}
            colors={colors}
            rank={NUMBER_OF_ROWS - idx}
            onSquarePress={handleSquarePress}
          />
        ))}
      </>

      {/* Drag and Drop Guide - clipped to the board; unlike a dragged piece,
      the guide should never be visible past the board's edge. */}
      <View
        style={{ position: "absolute", width, height: width, overflow: "hidden" }}
        pointerEvents="none"
      >
        <PieceDragAndDropGuide
          squareWidth={PIECE_WIDTH}
          position={dragGuidePosition}
          opacity={dragGuideOpacity}
        />
      </View>

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
                onSquarePress={handleSquarePress}
                resetSelectedSquare={resetSelectedSquare}
                isSquareSelected={isSquareSelected}
                showDragGuide={showDragGuide}
                hideDragGuide={hideDragGuide}
                showValidMovesGuide={showValidMovesGuide}
                clearValidMovesGuide={clearValidMovesGuide}
              />
            );
          })
        }
      </>
    </View>
  );
};

export default Chessboard;
