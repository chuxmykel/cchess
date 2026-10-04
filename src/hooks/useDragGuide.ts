import { useCallback, useRef } from "react";
import { Animated } from "react-native";

import { Position } from "../domain/types";
import { getSquareFromXY } from "../domain/boardCoordinates";
import { SQUARES } from "../constants";

export type DragGuide = {
  position: Animated.ValueXY;
  opacity: Animated.Value;
  show: () => void;
  hide: () => void;
  updatePosition: (currentPieceAnimatedPosition: Position) => void;
};

// Owns the drag-and-drop guide's Animated state: where it sits and whether
// it's visible, plus the handlers that drive both as a piece is dragged.
export function useDragGuide(pieceWidth: number): DragGuide {
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const show = useCallback(() => {
    opacity.setValue(1);
  }, [opacity]);

  const hide = useCallback(() => {
    opacity.setValue(0);
  }, [opacity]);

  const updatePosition = useCallback(
    (currentPieceAnimatedPosition: Position) => {
      const square = getSquareFromXY(currentPieceAnimatedPosition, pieceWidth);
      if (!SQUARES.includes(square)) {
        hide();
        return;
      }

      // Position before opacity, so a show can never land with the opacity
      // update ahead of the position update.
      position.setValue(currentPieceAnimatedPosition);
      show();
    },
    [pieceWidth, position, hide, show],
  );

  return { position, opacity, show, hide, updatePosition };
}
