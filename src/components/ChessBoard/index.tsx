import { useState } from "react";
import {
  View,
  Animated,
  StyleSheet,
  Pressable,
  Image,
} from "react-native";
import {
  Square,
  PieceSymbol,
  Color,
  Chess,
  Move
} from "chess.js";
import Row from "./components/Row";
import Piece from "./components/Piece";
import {
  getSquareFromXY,
  getXYFromSquare,
  isCaptureMove,
  isEnpassantMove,
  isKingSideCastlingMove,
  isPromotion,
  isQueenSideCastlingMove
} from "../../utils";
import { Position } from "../../types";
import {
  BLACK_KING_SIDE_CASTLE_SQUARE,
  BLACK_KING_SIDE_ROOK_INITIAL_SQUARE,
  BLACK_QUEEN_SIDE_CASTLE_SQUARE,
  BLACK_QUEEN_SIDE_ROOK_INITIAL_SQUARE,
  NUMBER_OF_ROWS,
  WHITE_KING_SIDE_CASTLE_SQUARE,
  WHITE_KING_SIDE_ROOK_INITIAL_SQUARE,
  WHITE_QUEEN_SIDE_CASTLE_SQUARE,
  WHITE_QUEEN_SIDE_ROOK_INITIAL_SQUARE,
  PIECES,
} from "../../constants";

type PieceDetails = {
  square: Square;
  type: PieceSymbol;
  color: Color;
  animatedPosition: Animated.ValueXY;
  key: string;
  id: `${Color}${PieceSymbol}`,
  captured: boolean;
  position: Position;
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
  const animationDuration = 150;
  const PIECE_WIDTH = width / NUMBER_OF_ROWS;
  const boardPieces: PieceDetails[] = [];
  game.board().forEach((row) => {
    row.forEach(
      (piece) => {
        if (piece) {
          const squareXYCoordinates = getXYFromSquare(piece.square, PIECE_WIDTH);
          const animatedPosition = new Animated.ValueXY(squareXYCoordinates);
          boardPieces.push({
            ...piece,
            animatedPosition,
            key: `${Math.random() * Date.now()}`,
            captured: false,
            position: squareXYCoordinates,
            id: `${piece.color}${piece.type}`
          })
        }
      }
    );
  });
  const [pieces, setPieces] = useState<PieceDetails[]>(boardPieces);
  const [showPromotionMenu, setShowPromotionMenu] = useState<boolean>(false);
  const [promotedPiece, setPromotedPiece] = useState<PieceDetails>(null);
  const [promotionMove, setPromotionMove] = useState<Move>(null);

  function handleMove(from: Position, to: Position) {
    let queenSideRook: PieceDetails;
    let kingSideRook: PieceDetails;
    let capturedPiece: PieceDetails;
    let capturedEnPassantPiece: PieceDetails;
    const updatedPieces: PieceDetails[] = [];
    const {
      toSquare,
      movedPiece,
      legalMove
    } = parsePieceMove(from, to);

    // Terminate early if move is illegal
    if (!legalMove) {
      revertPosition(movedPiece);
      return;
    }
    // Update the square of the moved piece
    updatedPieces.push({
      ...movedPiece,
      square: toSquare,
      position: to,
      animatedPosition: new Animated.ValueXY(to)
    });

    if (isCaptureMove(legalMove)) {
      capturedPiece = pieces.find((piece) => {
        return piece.square === toSquare && !piece.captured;
      });
      capturePiece(capturedPiece, updatedPieces);
    }

    if (isKingSideCastlingMove(legalMove)) {
      kingSideRook = getKingSideRook(legalMove.color)
      const newPosition = animateKingSideCastle(kingSideRook);
      updatedPieces.push({
        ...kingSideRook,
        square: getSquareFromXY(newPosition, PIECE_WIDTH),
        animatedPosition: new Animated.ValueXY(newPosition),
        position: newPosition,
      })
    }

    if (isQueenSideCastlingMove(legalMove)) {
      queenSideRook = getQueenSideRook(legalMove.color)
      const newPosition = animateQueenSideCastle(queenSideRook);
      updatedPieces.push({
        ...queenSideRook,
        square: getSquareFromXY(newPosition, PIECE_WIDTH),
        animatedPosition: new Animated.ValueXY(newPosition),
        position: newPosition,
      })
    }

    if (isEnpassantMove(legalMove)) {
      capturedEnPassantPiece = pieces.find((piece) => {
        return piece.square === getEnPassantSquare(toSquare);
      });
      capturePiece(capturedEnPassantPiece, updatedPieces);
    }

    if (isPromotion(legalMove)) {
      setShowPromotionMenu(true);
      setPromotedPiece(movedPiece);
      setPromotionMove(legalMove);
      return;

    }

    // FIXME: Smoothen out the effect of this update on the animation
    setPieces(prevPieces => {
      const prevPiecesWithoutUpdatedPieces = prevPieces.filter((prevPiece) => {
        const updatedPiece = updatedPieces
          .find((piece) => piece.key === prevPiece.key);
        return !updatedPiece;
      });

      return [
        ...prevPiecesWithoutUpdatedPieces,
        ...updatedPieces,
      ];
    });

    // Make the move
    game.move(legalMove);
  }

  function parsePieceMove(from: Position, to: Position) {
    const toSquare = getSquareFromXY(to, PIECE_WIDTH);
    const fromSquare = getSquareFromXY(from, PIECE_WIDTH);
    const movedPiece = pieces
      .find(piece => piece.square === fromSquare && !piece.captured);
    const legalMoves = game
      .moves({ square: fromSquare, verbose: true });
    const legalMove = legalMoves
      .find((move) => move.to === toSquare);
    return {
      toSquare,
      movedPiece,
      legalMove
    };
  }
  function revertPosition(piece: PieceDetails) {
    return animatePieceToPosition(
      piece,
      piece.position,
    );
  }
  function capturePiece(capturedPiece: PieceDetails, updatedPieces: PieceDetails[]): void {
    updatedPieces.push({
      ...capturedPiece,
      captured: true,
    });
  }
  function getKingSideRook(color: Color): PieceDetails {
    const kingSideRook = pieces
      .find(
        (piece) => color === "w" ?
          piece.square === WHITE_KING_SIDE_ROOK_INITIAL_SQUARE :
          piece.square === BLACK_KING_SIDE_ROOK_INITIAL_SQUARE,
      );
    return kingSideRook;
  }
  function getQueenSideRook(color: Color): PieceDetails {
    return pieces
      .find(
        (piece) => color === "w" ?
          piece.square === WHITE_QUEEN_SIDE_ROOK_INITIAL_SQUARE :
          piece.square === BLACK_QUEEN_SIDE_ROOK_INITIAL_SQUARE,
      );
  }
  function getEnPassantSquare(toSquare: Square): Square {
    const toSquareXYCoordinate = getXYFromSquare(toSquare, PIECE_WIDTH);
    const enPassantSquareXYCoordinate = {
      ...toSquareXYCoordinate,
      y: ((toSquareXYCoordinate.y / PIECE_WIDTH) + 1) * PIECE_WIDTH,
    };
    return getSquareFromXY(enPassantSquareXYCoordinate, PIECE_WIDTH);
  }
  function getPromotionSquare(fromSquare: Square): Square {
    const fromSquareXYCoordinate = getXYFromSquare(fromSquare, PIECE_WIDTH);
    const promotionSquareXYCoordinate = {
      ...fromSquareXYCoordinate,
      y: ((fromSquareXYCoordinate.y / PIECE_WIDTH) - 1) * PIECE_WIDTH,
    };
    return getSquareFromXY(promotionSquareXYCoordinate, PIECE_WIDTH);
  }
  function animatePieceToPosition(piece: PieceDetails, position: Position) {
    Animated.timing(piece.animatedPosition, {
      toValue: position,
      duration: animationDuration,
      useNativeDriver: true,
    }).start();
  }
  function animateQueenSideCastle(rook: PieceDetails) {
    const newPosition = getXYFromSquare(
      rook.color === "w" ?
        WHITE_QUEEN_SIDE_CASTLE_SQUARE
        : BLACK_QUEEN_SIDE_CASTLE_SQUARE,
      PIECE_WIDTH,
    );
    animatePieceToPosition(
      rook,
      newPosition,
    );
    return newPosition;
  }
  function animateKingSideCastle(rook: PieceDetails) {
    const newPosition = getXYFromSquare(
      rook.color === "w" ?
        WHITE_KING_SIDE_CASTLE_SQUARE
        : BLACK_KING_SIDE_CASTLE_SQUARE,
      PIECE_WIDTH
    );
    animatePieceToPosition(
      rook,
      newPosition
    );
    return newPosition;
  }
  function promotePiece(type: PieceSymbol) {
    setPieces(prevPieces => {
      const prevPiecesWithoutPromotedPiece = prevPieces
        .filter(prevPiece => prevPiece.key !== promotedPiece.key);
      const promotionSquare = getPromotionSquare(promotedPiece.square);
      const promotionPosition = getXYFromSquare(promotionSquare, PIECE_WIDTH);
      return [
        ...prevPiecesWithoutPromotedPiece,
        {
          ...promotedPiece,
          id: `${game.turn()}${type}`,
          square: promotionSquare,
          position: promotionPosition,
          animatedPosition: new Animated.ValueXY(promotionPosition),
        }
      ];
    });
    setShowPromotionMenu(false);
    setPromotedPiece(null);
    game.move({ ...promotionMove, promotion: type });
    setPromotionMove(null);
  }

  return (
    <View style={{ width, height: width }} testID="chessboard">
      {/* Board Surface */}
      <>
        {new Array(NUMBER_OF_ROWS).fill("").map((_, idx) => (
          <Row key={idx} colors={colors} rank={NUMBER_OF_ROWS - idx} />
        ))}
      </>

      {/* Promotion Menu */}
      {showPromotionMenu && (
        <>
          <View
            style={{
              ...styles.promotionMenu,
              height: width,
              width: width,
            }}
          >
            <View
              style={{
                height: PIECE_WIDTH * 2,
                backgroundColor: "#000",
                opacity: 1,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 15
              }}
            >
              {
                ["q", "r", "b", "n"].map((type: PieceSymbol) => {
                  return (
                    <Pressable
                      onPress={() => {
                        promotePiece(type);
                      }}
                      key={type}
                    >
                      <Image
                        source={PIECES[`${game.turn()}${type}`]}
                        style={{
                          width: PIECE_WIDTH,
                          height: PIECE_WIDTH,

                        }}
                      />
                    </Pressable>
                  );
                })
              }
            </View>
          </View>
        </>
      )}

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
                move={handleMove}
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

const styles = StyleSheet.create({
  promotionMenu: {
    position: "absolute",
    backgroundColor: "#fff",
    // backgroundColor: "#000",
    zIndex: 100,
    justifyContent: "center",
    opacity: 0.8
  }
});

