import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Color } from 'chess.js';

import StaticBoard from '../../components/ChessBoard/StaticBoard';
import { BOARD_THEMES } from '../../constants/boardThemes';

interface EarlierPositionOverlayProps {
  fen: string;
  visible: boolean;
  width: number;
  orientation: Color;
  /** Slide the pieces from one position to the next. */
  animate?: boolean;
}

// A position from earlier in the game, drawn over the live board while
// stepping back through it. Stepping forward onto the live position, it
// stays up until its pieces have slid there, so that last move is seen to
// be played too - then the live board, in the same position, shows again.
const EarlierPositionOverlay: React.FC<EarlierPositionOverlayProps> = ({
  fen,
  visible,
  width,
  orientation,
  animate = false,
}) => {
  const [shown, setShown] = useState({ visible, fen, lingering: false });
  // Hidden just now, while moving to a new position: shown until it's there.
  if (shown.visible !== visible || shown.fen !== fen) {
    setShown({
      visible,
      fen,
      lingering: animate && shown.visible && !visible && shown.fen !== fen,
    });
  }
  const isShown = visible || shown.lingering;

  return (
    <View
      style={[styles.overlay, !isShown && styles.hidden]}
      pointerEvents={visible ? 'auto' : 'none'}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      testID={visible ? 'earlier-position' : undefined}
    >
      <StaticBoard
        fen={fen}
        colors={BOARD_THEMES.test}
        width={width}
        orientation={orientation}
        animate={animate}
        onSettled={() =>
          setShown((now) =>
            now.lingering ? { ...now, lingering: false } : now,
          )
        }
      />
    </View>
  );
};

export default EarlierPositionOverlay;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  hidden: {
    opacity: 0,
  },
});
