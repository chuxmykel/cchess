import { View, Text, StyleSheet } from 'react-native';
import { Color } from 'chess.js';

import { GameUserSummary } from '../../network/socketEvents';
import { GameClockResult } from '../../hooks/useGameClock';
import GameClock from '../GameClock';

export interface PlayerBarProps {
  color: Color;
  white: GameUserSummary;
  black: GameUserSummary;
  clock: GameClockResult;
  turn: Color;
  isGameOver: boolean;
}

const PlayerBar: React.FC<PlayerBarProps> = ({
  color,
  white,
  black,
  clock,
  turn,
  isGameOver,
}) => {
  const isWhite = color === 'w';
  const player = isWhite ? white : black;

  return (
    <View style={styles.container} testID={`player-bar-${color}`}>
      <Text style={styles.name}>{player.displayName}</Text>
      <GameClock
        label={isWhite ? 'White' : 'Black'}
        ms={isWhite ? clock.whiteMs : clock.blackMs}
        isActive={!isGameOver && turn === color}
      />
    </View>
  );
};

export default PlayerBar;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
});
