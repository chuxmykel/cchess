import { PanResponderGestureState } from "react-native";
import { Color, PieceSymbol, Square } from "chess.js";

import { Position } from "../domain/types";

export function getNewPositionFromGesture(
  initialPosition: Position,
  gestureState: PanResponderGestureState,
  width: number,
): Position {
  const newX = Math.round((initialPosition.x + gestureState.dx) / width) * width;
  const newY = Math.round((initialPosition.y + gestureState.dy) / width) * width;
  return { x: newX, y: newY };
}

// A React/animation identity for a piece, stable across the whole game - it
// must NOT be tied to the piece's current square, since squares change every
// move and a changing id would make React remount the piece instead of
// animating it smoothly to its new position. The color/type/starting-square
// prefix is just for readability in devtools; the suffix is what actually
// guarantees uniqueness. Math.random() returns a float in [0, 1), so
// toString(36) always produces a "0." prefix - that's the same on every call
// (no entropy, just noise), so slice(2) drops those first two characters.
export function generatePieceId(color: Color, type: PieceSymbol, square: Square): string {
  return `${color}${type}-${square}-${Math.random().toString(36).slice(2)}`;
}
