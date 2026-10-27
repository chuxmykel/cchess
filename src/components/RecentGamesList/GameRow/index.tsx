import { View, Text, StyleSheet } from 'react-native';
import { formatDistanceToNowStrict, min } from 'date-fns';

import Avatar from '../../Avatar';
import GameTypeIcon from '../../GameTypeIcon';
import GameResultIcon from '../../GameResultIcon';
import RatingDiff from '../../RatingDiff';
import { GameSummary } from '../../../network/restClient';
import { formatRating } from '../../../utils/rating';

const ROW_ICON_SIZE = 26;

interface GameRowProps {
  game: GameSummary;
}

function subtitleFor(game: GameSummary): string {
  const finishedAt = min([game.endedAt ?? game.createdAt, Date.now()]);
  const timeAgo = formatDistanceToNowStrict(finishedAt, { addSuffix: true });
  return game.status === 'aborted' ? `Aborted • ${timeAgo}` : timeAgo;
}

const GameRow: React.FC<GameRowProps> = ({ game }) => {
  return (
    <View style={styles.row} testID={`game-row-${game.id}`}>
      <View style={styles.typeIcon}>
        <GameTypeIcon type={game.gameType} size={ROW_ICON_SIZE} />
      </View>
      <View style={styles.avatar}>
        <Avatar name={game.opponentDisplayName} size={36} />
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
    </View>
  );
};

export default GameRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  typeIcon: {
    width: ROW_ICON_SIZE,
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
  },
  rating: {
    fontWeight: '400',
    color: '#888',
  },
  outcome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});
