import { Pressable, View, Text } from 'react-native';
import { formatDistanceToNowStrict, min } from 'date-fns';

import Avatar from '../../Avatar';
import GameTypeIcon from '../../GameTypeIcon';
import GameResultIcon from '../../GameResultIcon';
import RatingDiff from '../../RatingDiff';
import { GameSummary } from '../../../network/restClient';
import { formatRating } from '../../../utils/rating';
import { makeStyles } from '../../../theme';

const ROW_ICON_SIZE = 26;

interface GameRowProps {
  game: GameSummary;
  onPress?: (game: GameSummary) => void;
}

function subtitleFor(game: GameSummary): string {
  const finishedAt = min([game.endedAt ?? game.createdAt, Date.now()]);
  const timeAgo = formatDistanceToNowStrict(finishedAt, { addSuffix: true });
  return game.status === 'aborted' ? `Aborted • ${timeAgo}` : timeAgo;
}

const GameRow: React.FC<GameRowProps> = ({ game, onPress }) => {
  const styles = useStyles();

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress && (() => onPress(game))}
      disabled={!onPress}
      accessibilityRole="button"
      testID={`game-row-${game.id}`}
    >
      <View style={styles.typeIcon}>
        <GameTypeIcon type={game.gameType} size={ROW_ICON_SIZE} />
      </View>
      <View style={styles.avatar}>
        <Avatar
          name={game.opponentDisplayName}
          color={game.opponentAvatarColor}
          size={36}
        />
      </View>
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>
          {game.opponentDisplayName}
          {game.opponentRating !== null && (
            <Text style={styles.rating}>
              {' '}
              {formatRating(game.opponentRating, game.opponentProvisional)}
            </Text>
          )}
        </Text>
        <Text style={styles.subtitle}>{subtitleFor(game)}</Text>
      </View>
      <View style={styles.outcome}>
        {game.ratingDiff !== null && (
          <RatingDiff diff={game.ratingDiff} testID="game-row-rating-diff" />
        )}
        {game.result && (
          <GameResultIcon result={game.result} size={ROW_ICON_SIZE} />
        )}
      </View>
    </Pressable>
  );
};

export default GameRow;

const useStyles = makeStyles((t) => ({
  pressed: {
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
  },
  typeIcon: {
    width: ROW_ICON_SIZE,
    alignItems: 'center',
    marginRight: t.spacing.md,
  },
  avatar: {
    marginRight: t.spacing.md,
  },
  details: {
    flex: 1,
  },
  name: {
    color: t.colors.text,
    fontSize: t.fontSize.base,
    fontWeight: t.fontWeight.semibold,
  },
  rating: {
    fontWeight: t.fontWeight.regular,
    color: t.colors.textMuted,
  },
  outcome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  subtitle: {
    fontSize: t.fontSize.sm,
    color: t.colors.textMuted,
    marginTop: t.spacing.xxs,
  },
}));
