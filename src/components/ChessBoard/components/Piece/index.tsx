import React, { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  PanResponder,
  Animated
} from 'react-native';
import { Chess, Move } from "chess.js";

import { PIECES } from "../../../../constants";
import { Position } from "../../../../types";
import { getSquareFromXY, getXYFromSquare } from "../../../../utils";


interface PieceProps {
  width: number;
  position: Position;
  animatedPosition: Animated.ValueXY;
  id: string;
  game: Chess;
  onMove: (move: Move) => void;
  opacity: Animated.Value;
  captured: boolean;
}

const Piece: React.FC<PieceProps> = ({
  width,
  position,
  animatedPosition,
  game,
  id,
  onMove,
  opacity,
  captured,
}) => {
  const [state, setState] = useState({
    currentPosition: position,
  });

  useEffect(() => {
    updatePositionState(position);
  }, [position.x, position.y]);

  const animationDuration = 150;
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => (game.turn() === id.charAt(0)) && !captured,
    onPanResponderMove: (_, gesture) => {
      // update the position of the piece based on the gesture
      animatedPosition.setValue({
        x: state.currentPosition.x + gesture.dx,
        y: state.currentPosition.y + gesture.dy,
      });
    },
    onPanResponderRelease: (_, gesture) => {
      // calculate the new position of the piece based on the gesture
      const newX =
        Math.round((state.currentPosition.x + gesture.dx) / width) * width;
      const newY =
        Math.round((state.currentPosition.y + gesture.dy) / width) * width;
      const newPositon: Position = {
        x: newX,
        y: newY,
      };
      moveTo(newPositon);
    },
  });

  function updatePositionState(position: Position) {
    setState({
      currentPosition: position,
    });
  }

  function moveTo(position: Position) {
    const toSquare = getSquareFromXY(position, width);
    const fromSquare = getSquareFromXY(state.currentPosition, width);
    const legalMoves = game.moves({ square: fromSquare, verbose: true });
    const legalMove = legalMoves.find((move) => move.to === toSquare);

    if (!legalMove) {
      // animate the piece back to its original position
      animateMovement(state.currentPosition).start();
      return;
    }

    // update the piece position based on the legal move
    const newXYPosition = getXYFromSquare(toSquare, width);
    updatePositionState(newXYPosition);


    // animate the piece to the new position
    animateMovement(newXYPosition).start();
    setTimeout(() => onMove(legalMove), animationDuration);
  }

  function animateMovement(toPosition: Position) {
    return Animated.timing(animatedPosition, {
      toValue: toPosition,
      duration: animationDuration,
      useNativeDriver: true,
    });
  }

  return (
    <Animated.View
      style={{
        ...styles.container,
        opacity,
        transform: [
          { translateX: animatedPosition.x },
          { translateY: animatedPosition.y },
        ],
      }}
      {...panResponder.panHandlers}
    >
      <Image
        source={PIECES[id]}
        style={{
          width: width,
          height: width,
          transform: [
            {
              rotate:
                id === `${game.turn()}k` && game.isCheckmate()
                  ? "120deg"
                  : "0deg",
            },
          ],
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

