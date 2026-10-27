import { View, Text, StyleSheet } from 'react-native';
import { Color } from 'chess.js';

import { GameUserSummary } from '../../network/socketEvents';
import { GameClockResult } from '../../hooks/useGameClock';
import GameClock from '../GameClock';

export const PLAYER_BAR_HEIGHT = 38;

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
    <View
      style={[styles.container, isGameOver && styles.faded]}
      testID={`player-bar-${color}`}
    >
      <View style={styles.identity}>
        <Text style={styles.name} numberOfLines={1}>
          {player.displayName}
        </Text>
        {player.rating !== null && (
          <Text style={styles.rating} testID={`player-rating-${color}`}>
            {player.rating}
          </Text>
        )}
      </View>
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
    minHeight: PLAYER_BAR_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  faded: {
    opacity: 0.5,
  },
  identity: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginRight: 12,
  },
  name: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  rating: {
    fontSize: 15,
    color: '#888',
  },
});
