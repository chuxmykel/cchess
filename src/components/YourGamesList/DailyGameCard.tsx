import { Pressable, Text, View } from 'react-native';

import Avatar from '../Avatar';
import { PositionBoard } from '../Board';
import { DailyGame } from '../../network/restClient';
import { DAILY_LOW_TIME_MS, formatTimeLeft } from '../../utils/timeLeft';
import Icon from '../Icon';
import { makeStyles, useTheme } from '../../theme';

/** A card's width - a little wider than a friend's. */
export const DAILY_GAME_CARD_WIDTH = 152;
const CARD_PADDING = 8;
export const DAILY_GAME_BOARD_WIDTH = DAILY_GAME_CARD_WIDTH - 2 * CARD_PADDING;
const AVATAR_SIZE = 28;
const PLAYER_GAP = 8;
const CARD_BORDER = 2;
/** A card's height: its board, and the opponent under it. */
export const DAILY_GAME_CARD_HEIGHT =
  2 * (CARD_PADDING + CARD_BORDER) +
  DAILY_GAME_BOARD_WIDTH +
  PLAYER_GAP +
  AVATAR_SIZE;

interface DailyGameCardProps {
  game: DailyGame;
  /** The time now, epoch ms, for the time left. */
  now: number;
  onPress: (game: DailyGame) => void;
  /** A pawn in the corner of a game on your move - where the cards stand
   * many to a screen, so it's quicker to find than the ring. */
  marksYourMove?: boolean;
}

// A daily game in progress: its board from your side, and the opponent as a
// player bar shows them - with the time left on the move under the name, and
// no rating. Ringed in the accent when it's your move; greyed out while it's
// theirs.
const DailyGameCard: React.FC<DailyGameCardProps> = ({
  game,
  now,
  onPress,
  marksYourMove = false,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const msLeft = new Date(game.moveDeadlineAt).getTime() - now;
  const timeLeft = formatTimeLeft(Math.max(msLeft, 0));

  return (
    <Pressable
      style={[styles.card, game.myTurn && styles.myTurn]}
      onPress={() => onPress(game)}
      accessibilityRole="button"
      accessibilityLabel={`Daily game against ${game.opponent.displayName}, ${
        game.myTurn ? 'your move' : 'their move'
      }, ${timeLeft} left`}
      testID={`daily-game-${game.id}`}
    >
      <View
        style={!game.myTurn && styles.waiting}
        pointerEvents="none"
        testID={`daily-game-${game.id}-board`}
      >
        <PositionBoard
          fen={game.fen}
          width={DAILY_GAME_BOARD_WIDTH}
          orientation={game.playedAsWhite ? 'w' : 'b'}
          lastMove={game.lastMove}
          coordinates={false}
        />
      </View>
      <View style={styles.player}>
        <Avatar
          name={game.opponent.displayName}
          color={game.opponent.avatarColor}
          size={AVATAR_SIZE}
          square
        />
        <View style={styles.playerText}>
          <Text style={styles.name} numberOfLines={1}>
            {game.opponent.displayName}
          </Text>
          <Text
            style={[
              styles.timeLeft,
              game.myTurn && styles.timeLeftMyTurn,
              msLeft < DAILY_LOW_TIME_MS && styles.timeLeftLow,
            ]}
            testID={`daily-game-${game.id}-time-left`}
          >
            {timeLeft}
          </Text>
        </View>
        {marksYourMove && game.myTurn && (
          <Icon
            name="chess-pawn"
            size={20}
            color={colors.accent}
            testID={`daily-game-${game.id}-your-move`}
          />
        )}
      </View>
    </Pressable>
  );
};

export default DailyGameCard;

const useStyles = makeStyles((t) => ({
  card: {
    width: DAILY_GAME_CARD_WIDTH,
    padding: CARD_PADDING,
    borderRadius: t.radius.md,
    borderWidth: CARD_BORDER,
    borderColor: 'transparent',
    backgroundColor: t.colors.surface,
    ...t.elevation.sm,
    shadowColor: t.colors.shadow,
  },
  myTurn: {
    borderColor: t.colors.accent,
  },
  // Nothing to do here until they've moved.
  waiting: {
    opacity: 0.45,
  },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    marginTop: PLAYER_GAP,
  },
  playerText: {
    flex: 1,
  },
  name: {
    color: t.colors.text,
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.semibold,
  },
  timeLeft: {
    color: t.colors.textMuted,
    fontSize: t.fontSize.xs,
    fontVariant: ['tabular-nums'],
  },
  timeLeftMyTurn: {
    color: t.colors.text,
    fontWeight: t.fontWeight.semibold,
  },
  timeLeftLow: {
    color: t.colors.danger,
  },
}));
