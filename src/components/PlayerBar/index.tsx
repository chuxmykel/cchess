import { View, Text, StyleSheet } from 'react-native';
import { Color } from 'chess.js';

import { GameUserSummary } from '../../network/socketEvents';
import { GameClockResult } from '../../hooks/useGameClock';
import GameClock from '../GameClock';
import { formatRating } from '../../utils/rating';

export const PLAYER_BAR_HEIGHT = 38;
const FIRST_MOVE_WARNING_SECONDS = 10;

export interface PlayerBarProps {
  color: Color;
  white: GameUserSummary;
  black: GameUserSummary;
  clock: GameClockResult;
  turn: Color;
  isGameOver: boolean;
  firstMoveSecondsLeft?: number | null;
}

const PlayerBar: React.FC<PlayerBarProps> = ({
  color,
  white,
  black,
  clock,
  turn,
  isGameOver,
  firstMoveSecondsLeft = null,
}) => {
  const isWhite = color === 'w';
  const player = isWhite ? white : black;
  const showsFirstMoveCountdown =
    !isGameOver && turn === color && firstMoveSecondsLeft !== null;

  return (
    <View
      style={[styles.container, isGameOver && styles.faded]}
      testID={`player-bar-${color}`}
    >
      <View style={styles.details}>
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {player.displayName}
          </Text>
          {player.rating !== null && (
            <Text style={styles.rating} testID={`player-rating-${color}`}>
              {formatRating(player.rating, player.provisional)}
            </Text>
          )}
        </View>
        {showsFirstMoveCountdown && (
          <Text
            style={[
              styles.firstMoveCountdown,
              firstMoveSecondsLeft <= FIRST_MOVE_WARNING_SECONDS &&
                styles.firstMoveWarning,
            ]}
            testID={`first-move-countdown-${color}`}
          >
            {`${firstMoveSecondsLeft} seconds to play the first move`}
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
  details: {
    flexShrink: 1,
    marginRight: 12,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  firstMoveCountdown: {
    fontSize: 12,
    color: '#888',
  },
  firstMoveWarning: {
    color: '#d33',
    fontWeight: '600',
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
