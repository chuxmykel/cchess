import { useMemo } from 'react';
import { SharedValue, useSharedValue } from 'react-native-reanimated';
import { Color, Square } from 'chess.js';

// A drop that takes a piece: the move, and the piece it takes - hidden from
// the moment of the drop, rather than showing under the one taking it until
// JS has made the move.
export type TakenByDrop = {
  from: Square;
  to: Square;
  color: Color;
};

export type DragGuide = {
  // The top-left corner of the square under the finger.
  x: SharedValue<number>;
  y: SharedValue<number>;
  opacity: SharedValue<number>;
  // The top-left corner of the dragged piece's own square, marked while it's
  // held; null when nothing is.
  origin: SharedValue<{ x: number; y: number } | null>;
  taken: SharedValue<TakenByDrop | null>;
};

// The drag-and-drop guide's state: the square it marks and whether it shows,
// the square the dragged piece came from, and the piece a drop has just
// taken. Shared values, not state - a drag
// moves it on the UI thread every frame (see usePieceGesture), with no trip
// through JS. The same object every render, since every piece is given it: a
// new one would re-render them all.
export function useDragGuide(): DragGuide {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);
  const origin = useSharedValue<{ x: number; y: number } | null>(null);
  const taken = useSharedValue<TakenByDrop | null>(null);
  return useMemo(
    () => ({ x, y, opacity, origin, taken }),
    [x, y, opacity, origin, taken],
  );
}
