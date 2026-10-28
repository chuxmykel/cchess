import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Color } from 'chess.js';

import { GameUserSummary } from '../../network/socketEvents';
import { GameClockResult } from '../../hooks/useGameClock';
import GameClock from '../GameClock';
import CapturedPieces from '../CapturedPieces';
import { SideMaterial } from '../../domain/material';
import { formatRating } from '../../utils/rating';
import { ACCENT_COLOR } from '../../constants/colors';

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
  isOnline?: boolean;
  material?: SideMaterial;
  /** Makes the player's name open their profile. */
  onPressPlayer?: (player: GameUserSummary) => void;
}

const PlayerBar: React.FC<PlayerBarProps> = ({
  color,
  white,
  black,
  clock,
  turn,
  isGameOver,
  firstMoveSecondsLeft = null,
  isOnline,
  material,
  onPressPlayer,
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
        <Pressable
          style={styles.identity}
          onPress={onPressPlayer ? () => onPressPlayer(player) : undefined}
          disabled={!onPressPlayer}
          accessibilityRole={onPressPlayer ? 'button' : undefined}
          accessibilityHint={onPressPlayer ? 'Opens their profile' : undefined}
          testID={`player-name-${color}`}
        >
          {isOnline !== undefined && (
            <View
              style={[styles.presence, !isOnline && styles.offline]}
              accessibilityLabel={isOnline ? 'Online' : 'Offline'}
              testID={`presence-${color}`}
            />
          )}
          <Text style={styles.name} numberOfLines={1}>
            {player.displayName}
          </Text>
          {player.rating !== null && (
            <Text style={styles.rating} testID={`player-rating-${color}`}>
              {formatRating(player.rating, player.provisional)}
            </Text>
          )}
        </Pressable>
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
        {!showsFirstMoveCountdown && material && (
          <CapturedPieces color={color} material={material} />
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
    alignItems: 'center',
    gap: 6,
  },
  presence: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT_COLOR,
  },
  offline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#bbb',
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
