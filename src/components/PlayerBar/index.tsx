import { Pressable, View, Text } from 'react-native';
import { Color } from 'chess.js';

import { GameUserSummary, SeriesScore } from '../../network/socketEvents';
import { GameClockResult } from '../../hooks/useGameClock';
import Avatar from '../Avatar';
import GameClock from '../GameClock';
import CapturedPieces from '../CapturedPieces';
import { SideMaterial } from '../../domain/material';
import { formatRating } from '../../utils/rating';
import { makeStyles } from '../../theme';

export const PLAYER_BAR_HEIGHT = 40;
const FIRST_MOVE_WARNING_SECONDS = 10;
const AVATAR_SIZE = 36;
const SERIES_BAND_HEIGHT = 13;
// The name and the line under it - the first-move countdown or captured
// pieces - each keep their height, shown or not.
const NAME_LINE_HEIGHT = 20;
const SUBLINE_HEIGHT = 16;

export interface PlayerBarProps {
  color: Color;
  white: GameUserSummary;
  black: GameUserSummary;
  clock: GameClockResult;
  turn: Color;
  isGameOver: boolean;
  /** Dims the bar - behind the result card. Defaults to once the game is
   * over. */
  faded?: boolean;
  firstMoveSecondsLeft?: number | null;
  isOnline?: boolean;
  material?: SideMaterial;
  /** Makes the player's name open their profile. */
  onPressPlayer?: (player: GameUserSummary) => void;
  /** A rematch series' score, shown as this side's points. */
  series?: SeriesScore | null;
  /** A daily game: the clock shows the days and hours left on the move. */
  daily?: boolean;
}

const PlayerBar: React.FC<PlayerBarProps> = ({
  color,
  white,
  black,
  clock,
  turn,
  isGameOver,
  faded = isGameOver,
  firstMoveSecondsLeft = null,
  isOnline,
  material,
  onPressPlayer,
  series = null,
  daily = false,
}) => {
  const styles = useStyles();

  const isWhite = color === 'w';
  const player = isWhite ? white : black;
  // Decimal, so it reads at a glance in the avatar's small segment: "1.5".
  const seriesPoints = series && String(series[isWhite ? 'white' : 'black']);
  const openProfile = onPressPlayer ? () => onPressPlayer(player) : undefined;
  const showsFirstMoveCountdown =
    !isGameOver && turn === color && firstMoveSecondsLeft !== null;

  return (
    <View
      style={[styles.container, faded && styles.faded]}
      testID={`player-bar-${color}`}
    >
      <Pressable
        style={styles.avatarSlot}
        onPress={openProfile}
        disabled={!onPressPlayer}
        // The name beside it is the accessible way to their profile.
        accessible={false}
        testID={`player-avatar-${color}`}
      >
        <View style={styles.avatar}>
          <Avatar
            name={player.displayName}
            color={player.avatarColor}
            size={AVATAR_SIZE}
            square
            // Lifted clear of the series band while it shows.
            raiseInitials={seriesPoints !== null ? SERIES_BAND_HEIGHT / 2 : 0}
          />
          {seriesPoints !== null && (
            <View style={styles.seriesSegment}>
              <Text
                style={styles.seriesPoints}
                accessibilityLabel={`Series score ${seriesPoints}`}
                testID={`series-points-${color}`}
              >
                {seriesPoints}
              </Text>
            </View>
          )}
        </View>
        {isOnline !== undefined && (
          <View
            style={[styles.presence, !isOnline && styles.offline]}
            accessibilityLabel={isOnline ? 'Online' : 'Offline'}
            testID={`presence-${color}`}
          />
        )}
      </Pressable>
      <View style={styles.details}>
        <Pressable
          style={styles.identity}
          onPress={openProfile}
          disabled={!onPressPlayer}
          accessibilityRole={onPressPlayer ? 'button' : undefined}
          accessibilityHint={onPressPlayer ? 'Opens their profile' : undefined}
          testID={`player-name-${color}`}
        >
          <Text style={styles.name} numberOfLines={1}>
            {player.displayName}
          </Text>
          {player.rating !== null && (
            <Text style={styles.rating} testID={`player-rating-${color}`}>
              {formatRating(player.rating, player.provisional)}
            </Text>
          )}
        </Pressable>
        {/* Always there, empty or not, so nothing moves when the
            countdown or the first capture shows up. */}
        <View style={styles.subline} testID={`player-subline-${color}`}>
          {showsFirstMoveCountdown && (
            <Text
              style={[
                styles.firstMoveCountdown,
                firstMoveSecondsLeft <= FIRST_MOVE_WARNING_SECONDS &&
                  styles.firstMoveWarning,
              ]}
              numberOfLines={1}
              testID={`first-move-countdown-${color}`}
            >
              {`${firstMoveSecondsLeft} seconds to play the first move`}
            </Text>
          )}
          {!showsFirstMoveCountdown && material && (
            <CapturedPieces color={color} material={material} />
          )}
        </View>
      </View>
      <GameClock
        label={isWhite ? 'White' : 'Black'}
        ms={isWhite ? clock.whiteMs : clock.blackMs}
        isActive={!isGameOver && turn === color}
        daily={daily}
      />
    </View>
  );
};

export default PlayerBar;

const useStyles = makeStyles((t) => ({
  container: {
    width: '100%',
    height: PLAYER_BAR_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: t.spacing.lg,
  },
  faded: {
    opacity: 0.5,
  },
  avatarSlot: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    marginRight: t.spacing.md,
  },
  avatar: {
    overflow: 'hidden',
    borderRadius: AVATAR_SIZE * 0.15,
  },
  // A band across the bottom of the avatar.
  seriesSegment: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SERIES_BAND_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.overlay,
  },
  details: {
    flex: 1,
    flexShrink: 1,
    marginRight: t.spacing.md,
  },
  identity: {
    height: NAME_LINE_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  subline: {
    height: SUBLINE_HEIGHT,
    justifyContent: 'center',
  },
  // A badge on the avatar's top right corner.
  presence: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 11,
    height: 11,
    borderRadius: t.radius.sm,
    borderWidth: 2,
    borderColor: t.colors.background,
    backgroundColor: t.colors.accent,
  },
  offline: {
    backgroundColor: t.colors.presenceOffline,
  },
  firstMoveCountdown: {
    fontSize: t.fontSize.sm,
    color: t.colors.textMuted,
  },
  firstMoveWarning: {
    color: t.colors.danger,
    fontWeight: t.fontWeight.semibold,
  },
  name: {
    color: t.colors.text,
    flexShrink: 1,
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.semibold,
  },
  rating: {
    fontSize: t.fontSize.lg,
    color: t.colors.textMuted,
  },
  seriesPoints: {
    fontSize: t.fontSize.micro,
    fontWeight: t.fontWeight.bold,
    color: t.colors.textOnAccent,
  },
}));
