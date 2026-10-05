import { memo } from "react";
import { StyleSheet, Animated } from "react-native";
import { Square } from "chess.js";

import { PIECES } from "../../../../constants";
import { Position } from "../../../../domain/types";
import { getSquareFromXY } from "../../../../domain/boardCoordinates";
import { usePieceGesture } from "../../../../hooks/usePieceGesture";

interface PieceProps {
  width: number;
  position: Position;
  animatedPosition: Animated.ValueXY;
  id: string;
  disabled: boolean;
  opacity: Animated.Value;
  onTap: (square: Square) => void;
  onDragRelease: (from: Square, to: Square) => void;
  onDragStart: (square: Square) => void;
  onDrag: (currentPosition: Position) => void;
  showDragGuide: () => void;
  hideDragGuide: () => void;
}

const Piece: React.FC<PieceProps> = (props) => {
  const { width, position, animatedPosition, id, opacity } = props;
  const square = getSquareFromXY(position, width);
  const { panHandlers, scale, zIndex } = usePieceGesture(props, square);

  return (
    <Animated.View
      style={{
        ...styles.container,
        transform: [
          { translateX: animatedPosition.x },
          { translateY: animatedPosition.y },
          { scale: scale },
        ],
        zIndex,
        opacity,
      }}
      testID={`piece-${square}`}
      {...panHandlers}
    >
      <Animated.Image
        source={PIECES[id]}
        style={{
          width: width,
          height: width,
        }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
  },
});

// `position` is a plain `{x, y}` object rebuilt fresh on every Chessboard
// render (even when its values haven't changed), so the default shallow
// comparator would never consider two renders equal - compare its fields by
// value instead. Everything else compares correctly by reference, including
// the callback props, which Chessboard keeps stable via useCallback so this
// memoization skips re-rendering unrelated pieces: selecting one square
// shouldn't re-render all the others.
function arePropsEqual(prev: PieceProps, next: PieceProps): boolean {
  return (
    prev.id === next.id &&
    prev.disabled === next.disabled &&
    prev.width === next.width &&
    prev.position.x === next.position.x &&
    prev.position.y === next.position.y &&
    prev.animatedPosition === next.animatedPosition &&
    prev.opacity === next.opacity &&
    prev.onTap === next.onTap &&
    prev.onDragRelease === next.onDragRelease &&
    prev.onDragStart === next.onDragStart &&
    prev.onDrag === next.onDrag &&
    prev.showDragGuide === next.showDragGuide &&
    prev.hideDragGuide === next.hideDragGuide
  );
}

export default memo(Piece, arePropsEqual);
