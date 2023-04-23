import { useState } from 'react';
import { View, StyleSheet, useWindowDimensions, Animated } from 'react-native';
import { Chess, Move, PieceSymbol } from "chess.js";

import { PieceDetails, Position } from '../../types';
import { NUMBER_OF_ROWS } from "../../constants";

import {
  animateKingSideCastle,
  animateQueenSideCastle,
  getSquareFromXY,
  getXYFromSquare,
  isCaptureMove,
  isEnpassantMove,
  isKingSideCastlingMove,
  isPromotion,
  isQueenSideCastlingMove,
  animatePieceToPosition,
  parsePieceMove,
  revertMove,
  capturePiece,
  getQueenSideRook,
  getKingSideRook,
  getEnPassantSquare,
  getPromotionSquare,
} from "../../utils";

import PromotionMenu from '../../components/ChessBoard/components/PromotionMenu';
import Chessboard from '../../components/ChessBoard';


const Game: React.FC = () => {
  // NOTE: Use positon from FEN

  // Fried liver attack (King Side Castle)
  // const [game] = useState(new Chess("r1bqk2r/pppp1ppp/2n2n2/2b1p1N1/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 6 5"));

  // Queen side castle
  // const [game] = useState(new Chess("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R3KBNR w KQkq - 0 1"));

  // Promotion
  // const [game] = useState(new Chess("8/4P3/8/2k5/8/4K3/8/8 w - - 0 1"));

  // Pre - en passant
  // const [game] = useState(new Chess("rnbqkbnr/pppp1ppp/4p3/4P3/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"))

  // New Game
  const { width } = useWindowDimensions();
  const [game] = useState(new Chess());
  const PIECE_WIDTH = width / NUMBER_OF_ROWS;
  const boardPieces: PieceDetails[] = [];
  game.board().forEach((row) => {
    row.forEach(
      (piece) => {
        if (piece) {
          const squareXYCoordinates = getXYFromSquare(piece.square, PIECE_WIDTH);
          const animatedPosition = new Animated.ValueXY(squareXYCoordinates);
          const opacity = new Animated.Value(1);
          boardPieces.push({
            ...piece,
            animatedPosition,
            key: `${Math.random() * Date.now()}`,
            captured: false,
            position: squareXYCoordinates,
            id: `${piece.color}${piece.type}`,
            opacity,
          })
        }
      }
    );
  });
  const [pieces, setPieces] = useState<PieceDetails[]>(boardPieces);
  const [showPromotionMenu, setShowPromotionMenu] = useState<boolean>(false);
  const [promotedPiece, setPromotedPiece] = useState<PieceDetails>(null);
  const [promotionMove, setPromotionMove] = useState<Move>(null);

  const themes = {
    "chess.com": {
      dark: "#769656",
      light: "#eeeed2",
    },
    "lichess.org": {
      dark: "#b58863",
      light: "#f1d9b4",
    },
    "monochrome": {
      dark: "#888",
      light: "#fff"
    },
    "powderblue": {
      light: "powderblue",
      dark: "grey"
    },
    "test": {
      light: "#d0dff4",
      dark: "#4b648a"
    }
  }

  // Randon Vs Random game
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     const moves = game.moves({ verbose: true });
  //     const randomMove = moves[Math.floor(Math.random() * moves.length)];
  //     handleMove(
  //       getXYFromSquare(randomMove.from, PIECE_WIDTH),
  //       getXYFromSquare(randomMove.to, PIECE_WIDTH)
  //     );
  //   }, 500);
  //   return () => clearInterval(interval);
  // }, [game.turn()]);

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
    } = parsePieceMove(from, to, PIECE_WIDTH, pieces, game);

    // Terminate early to avoid lenghthy checks
    // if move is illegal
    if (!legalMove) {
      revertMove(movedPiece);
      return;
    }


    if (isCaptureMove(legalMove)) {
      capturedPiece = pieces.find((piece) => {
        return piece.square === toSquare && !piece.captured;
      });
      capturePiece(capturedPiece, updatedPieces);
    }

    if (isKingSideCastlingMove(legalMove)) {
      kingSideRook = getKingSideRook(legalMove.color, pieces);
      const newPosition = animateKingSideCastle(kingSideRook, PIECE_WIDTH);
      updatedPieces.push({
        ...kingSideRook,
        square: getSquareFromXY(newPosition, PIECE_WIDTH),
        animatedPosition: new Animated.ValueXY(newPosition),
        position: newPosition,
      })
    }

    if (isQueenSideCastlingMove(legalMove)) {
      queenSideRook = getQueenSideRook(legalMove.color, pieces);
      const newPosition = animateQueenSideCastle(queenSideRook, PIECE_WIDTH);
      updatedPieces.push({
        ...queenSideRook,
        square: getSquareFromXY(newPosition, PIECE_WIDTH),
        animatedPosition: new Animated.ValueXY(newPosition),
        position: newPosition,
      })
    }

    if (isEnpassantMove(legalMove)) {
      capturedEnPassantPiece = pieces.find((piece) => {
        return piece.square === getEnPassantSquare(toSquare, PIECE_WIDTH);
      });
      capturePiece(capturedEnPassantPiece, updatedPieces);
    }

    if (isPromotion(legalMove)) {
      setShowPromotionMenu(true);
      setPromotedPiece(movedPiece);
      setPromotionMove(legalMove);
      return;
    }


    // Animate the mvoed piece to it's new pisiton
    animatePieceToPosition(movedPiece, to, () => {
      // Update the moved piece data
      updatedPieces.push({
        ...movedPiece,
        square: toSquare,
        position: to,
        animatedPosition: new Animated.ValueXY(to)
      });
      updateBoardState(updatedPieces);
    });

    // Make the move
    game.move(legalMove);
  }

  function updateBoardState(updatedPieces: PieceDetails[]) {
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
  }

  function promotePiece(type: PieceSymbol) {
    setPieces(prevPieces => {
      const prevPiecesWithoutPromotedPiece = prevPieces
        .filter(prevPiece => prevPiece.key !== promotedPiece.key);
      const promotionSquare = getPromotionSquare(promotedPiece.square, PIECE_WIDTH);
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
    <View style={styles.container}>
      <Chessboard
        game={game}
        colors={themes.test}
        width={width}
        onMove={handleMove}
        pieces={pieces}
      />
      {/* Promotion Menu */}
      {showPromotionMenu && (
        <>
          <PromotionMenu
            promotingColor={game.turn()}
            boardWidth={width}
            pieceWidth={PIECE_WIDTH}
            handlePromotion={promotePiece}
          />
        </>
      )}
    </View>
  );
}

export default Game;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

