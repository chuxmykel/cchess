import { useState } from "react";
import { View, Animated } from "react-native";
import { Square, PieceSymbol, Color, Chess, Move } from "chess.js";

import Row from "./components/Row";
import Piece from "./components/Piece";
import { getXYFromSquare, isCaptureMove, isCastlingMove, isEnpassantMove, isPromotion } from "../../utils";
import { Position } from "../../types";
import { NUMBER_OF_ROWS } from "../../constants";

type PieceDetails = {
  square: Square;
  type: PieceSymbol;
  color: Color;
  animatedPosition: Animated.ValueXY;
  key: string;
} | null;

interface ChessboardProps {
  game: Chess;
  colors: {
    light: string;
    dark: string;
  };
  width: number;
}

const Chessboard: React.FC<ChessboardProps> = ({ game, colors, width }) => {
  const animationDuration = 100;
  const PIECE_WIDTH = width / NUMBER_OF_ROWS;
  const boardPieces = [];
  game.board().forEach((row) => {
    row.forEach(
      (piece) => {
        if (piece) {
          const squareXYCoordinates = getXYFromSquare(piece.square, PIECE_WIDTH);
          const animatedPosition = new Animated.ValueXY(squareXYCoordinates);
          boardPieces.push({
            ...piece,
            animatedPosition,
            // FIXME: Random key? Might be okay since the pieces are finite.
            key: `${Math.random() * Date.now()}`,
          })
        }
      }
    );
  });

  const [pieces, setPieces] = useState<PieceDetails[]>(boardPieces);


  function handleMove(move: Move) {
    const toSquare = move.to;
    const fromSquare = move.from;
    let capturedPiece: PieceDetails;

    if (isCaptureMove(move)) {
      capturedPiece = pieces.find(piece => piece.square === toSquare);
      animateCapture(capturedPiece);
    }

    if (isCastlingMove(move)) {
      // TODO: Animate castling
      console.log(move, "Castling move ============> ");
    }

    if (isEnpassantMove(move)) {
      // TODO: Animate en passant
      console.log(move, "en passant move ============> ");
    }

    if (isPromotion(move)) {
      // TODO: Animate / Handle promotion
      console.log(move, "Promotion move ============> ");
    }

    const movedPiece = pieces.find(piece => piece.square === fromSquare);


    // Update the square of the moved piece
    // FIXME: Smoothen out the effect of this update on the animation
    setPieces(prevPieces => {
      return [
        ...prevPieces
          .filter(piece => piece.square !== movedPiece.square)
          .filter(piece => piece.square !== capturedPiece?.square),
        {
          ...movedPiece,
          square: toSquare,
        },
      ];
    });

    // Make the move
    game.move(move);
  }

  function animatePieceToPosition(piece: PieceDetails, position: Position) {
    Animated.timing(piece.animatedPosition, {
      toValue: position,
      duration: animationDuration,
      useNativeDriver: true,
    }).start();
  }

  function animateCapture(piece: PieceDetails) {
    animatePieceToPosition(piece, { x: width / 2, y: 1000 });
  }

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
          pieces.map((pieceDetails: PieceDetails) => (
            <Piece
              key={pieceDetails.key}
              id={`${pieceDetails.color}${pieceDetails.type}`}
              width={PIECE_WIDTH}
              position={getXYFromSquare(pieceDetails.square, PIECE_WIDTH)}
              animatedPosition={pieceDetails.animatedPosition}
              game={game}
              onMove={handleMove}
            />
          ))
        }
      </>
    </View>
  );
};

export default Chessboard;

