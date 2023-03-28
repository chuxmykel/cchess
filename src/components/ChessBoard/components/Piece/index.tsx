import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  PanResponder,
  Animated
} from 'react-native';
import { Chess, Square } from "chess.js";

import { PIECES } from '../../../../constants';


interface Position {
  x: number;
  y: number;
};
interface PieceProps {
  width: number;
  position: Position;
  id: string;
  game: Chess;
  onTurn: () => void;
};
interface PieceState {
  currentPosition: Position;
  animatedPosition: Animated.ValueXY;
};

const Piece: React.FC<PieceProps> = ({ width, position, game, id, onTurn }) => {
  const [state, setState] = useState<PieceState>({
    currentPosition: position,
    animatedPosition: new Animated.ValueXY(position),
  });
  const animationDuration = 150;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      // update the position of the piece based on the gesture
      state
        .animatedPosition
        .setValue({
          x: state.currentPosition.x + gesture.dx,
          y: state.currentPosition.y + gesture.dy,
        });
    },
    onPanResponderRelease: (_, gesture) => {
      // calculate the new position of the piece based on the gesture
      const newX = Math
        .round((state.currentPosition.x + gesture.dx) / width) * width;
      const newY = Math
        .round((state.currentPosition.y + gesture.dy) / width) * width;
      const newPositon: Position = {
        x: newX,
        y: newY,
      };
      moveTo(newPositon);
    }
  });

  function moveTo(position: Position) {
    const toSquare = getSquareFromXY(position);
    const fromSquare = getSquareFromXY(state.currentPosition);
    const legalMoves = game.moves({ square: fromSquare, verbose: true });
    const legalMove = legalMoves.find(move => move.to === toSquare);

    if (legalMove) {
      // update the game state and the piece position based on the legal move
      game.move({
        from: legalMove.from,
        to: legalMove.to,
        promotion: "q",
      });
      setState({
        currentPosition: getXYFromSquare(toSquare),
        animatedPosition: new Animated
          .ValueXY(getXYFromSquare(toSquare)),
      });
      // FIXME: Fix flicker when pieces are moved
      // Animate Capture, Castling, Checkmate and en-passant.
      // onTurn();
      // setTimeout(onTurn, 0);
      // animate the piece to the new position
      Animated.timing(state.animatedPosition, {
        toValue: getXYFromSquare(toSquare),
        duration: animationDuration,
        useNativeDriver: true
      }).start();
    } else {
      // animate the piece back to its original position
      Animated.timing(state.animatedPosition, {
        toValue: state.currentPosition,
        duration: animationDuration,
        useNativeDriver: true
      }).start();
    }
  }
  // helper function to convert square notation to position
  function getXYFromSquare(square: string): Position {
    const file = square.charCodeAt(0) - 97;
    const rank = 8 - parseInt(square.charAt(1), 10);
    return { x: file * width, y: rank * width };
  }

  // helper function to convert position to square notation
  function getSquareFromXY(position: Position): Square {
    const file = String.fromCharCode(97 + Math.floor(position.x / width));
    const rank = 8 - Math.floor(position.y / width);
    return file + rank as Square;
  }

  return (
    <Animated.View
      style={{
        ...styles.container,
        transform: [
          { translateX: state.animatedPosition.x },
          { translateY: state.animatedPosition.y }
        ]
      }}
      {...panResponder.panHandlers}
    >
      <Image
        source={PIECES[id]}
        style={{
          width: width,
          height: width,
          transform: [{
            rotate: (id === `${game.turn()}k` && game.isCheckmate())
              ? "120deg" : "0deg"
          }]
        }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
});

export default Piece;

