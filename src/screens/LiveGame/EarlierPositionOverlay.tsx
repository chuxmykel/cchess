import { View, StyleSheet } from 'react-native';
import { Color } from 'chess.js';

import StaticBoard from '../../components/ChessBoard/StaticBoard';
import { BOARD_THEMES } from '../../constants/boardThemes';

interface EarlierPositionOverlayProps {
  fen: string;
  visible: boolean;
  width: number;
  orientation: Color;
}

const EarlierPositionOverlay: React.FC<EarlierPositionOverlayProps> = ({
  fen,
  visible,
  width,
  orientation,
}) => (
  <View
    style={[styles.overlay, !visible && styles.hidden]}
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
    />
  </View>
);

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
