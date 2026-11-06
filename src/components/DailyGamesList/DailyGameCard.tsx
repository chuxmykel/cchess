import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import Avatar from '../Avatar';
import { PositionBoard } from '../Board';
import { DailyGame } from '../../network/restClient';
import { DAILY_LOW_TIME_MS, formatTimeLeft } from '../../utils/timeLeft';
import Icon from '../Icon';
import { makeStyles, useTheme } from '../../theme';

/** A card's width on Home - a little wider than a friend's. */
export const DAILY_GAME_CARD_WIDTH = 152;
const CARD_PADDING = 8;
/** The board on a card of this width. */
export const dailyGameBoardWidth = (cardWidth: number) =>
  cardWidth - 2 * CARD_PADDING;
export const DAILY_GAME_BOARD_WIDTH = dailyGameBoardWidth(
  DAILY_GAME_CARD_WIDTH,
);
export const DAILY_GAME_AVATAR_SIZE = 28;
const PLAYER_GAP = 8;

interface DailyGameCardProps {
  game: DailyGame;
  /** The time now, epoch ms, for the time left. */
  now: number;
  onPress: (game: DailyGame) => void;
  /** Its width, Home's unless given. */
  width?: number;
  /** A pawn in the corner of a game on your move - where the cards stand
   * many to a screen, so it's quicker to find than the ring. */
  marksYourMove?: boolean;
}

// A daily game in progress: its board from your side, and the opponent as a
// player bar shows them - with the time left on the move under the name, and
// no rating. Greyed out while it's their move. Memoised: a list of them
// re-sorted, or the time ticking on, redraws only the cards that changed.
const DailyGameCard: React.FC<DailyGameCardProps> = ({
  game,
  now,
  onPress,
  width = DAILY_GAME_CARD_WIDTH,
  marksYourMove = false,
}) => {
  const styles = useDailyGameCardStyles();
  const { colors } = useTheme();
  const msLeft = new Date(game.moveDeadlineAt).getTime() - now;
  const timeLeft = formatTimeLeft(Math.max(msLeft, 0));

  return (
    <Pressable
      style={[styles.card, { width }]}
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
          width={dailyGameBoardWidth(width)}
          orientation={game.playedAsWhite ? 'w' : 'b'}
          lastMove={game.lastMove}
          coordinates={false}
        />
      </View>
      <View style={styles.player}>
        <Avatar
          name={game.opponent.displayName}
          color={game.opponent.avatarColor}
          size={DAILY_GAME_AVATAR_SIZE}
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
            color={colors.textMuted}
            testID={`daily-game-${game.id}-your-move`}
          />
        )}
      </View>
    </Pressable>
  );
};

export default memo(DailyGameCard);

export const useDailyGameCardStyles = makeStyles((t) => ({
  card: {
    width: DAILY_GAME_CARD_WIDTH,
    padding: CARD_PADDING,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
    ...t.elevation.sm,
    shadowColor: t.colors.shadow,
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
