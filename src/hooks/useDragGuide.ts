import { SharedValue, useSharedValue } from 'react-native-reanimated';

export type DragGuide = {
  // The top-left corner of the square under the dragged piece.
  x: SharedValue<number>;
  y: SharedValue<number>;
  opacity: SharedValue<number>;
};

// The drag-and-drop guide's state: the square it marks and whether it shows.
// Shared values, not state - a drag moves it on the UI thread every frame
// (see usePieceGesture), with no trip through JS.
export function useDragGuide(): DragGuide {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);
  return { x, y, opacity };
}
