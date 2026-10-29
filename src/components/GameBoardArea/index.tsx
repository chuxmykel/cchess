import { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

import { PLAYER_BAR_HEIGHT } from '../PlayerBar';

interface GameBoardAreaProps {
  /** A player bar, the board and the other bar - or a PlayerBarSpace
   * where a bar isn't shown yet. */
  children: ReactNode;
  testID?: string;
}

// The board between its two player bars - the same space between each bar
// and the board - with more of the room it has left below them than above,
// clear of the toolbar. Every screen showing a game lays it out here, so
// the board stays put moving between them: seeking, loading, then playing.
const GameBoardArea: React.FC<GameBoardAreaProps> = ({ children, testID }) => (
  <View style={styles.area} testID={testID}>
    <View style={styles.spaceAbove} />
    <View style={styles.stack}>{children}</View>
    <View style={styles.spaceBelow} />
  </View>
);

/** The room a player bar takes, kept while there's none to show. */
export const PlayerBarSpace: React.FC = () => <View style={styles.barSpace} />;

export default GameBoardArea;

const styles = StyleSheet.create({
  area: {
    flex: 1,
  },
  // The room left over, one part above the bars for two below, keeping
  // the lower bar well clear of the toolbar under it.
  spaceAbove: {
    flex: 1,
  },
  spaceBelow: {
    flex: 2,
  },
  stack: {
    gap: 24,
  },
  barSpace: {
    height: PLAYER_BAR_HEIGHT,
  },
});
