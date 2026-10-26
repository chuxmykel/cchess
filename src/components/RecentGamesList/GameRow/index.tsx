import { View, Text, StyleSheet } from 'react-native';

import Avatar from '../../Avatar';
import GameTypeIcon from '../../GameTypeIcon';
import GameResultIcon from '../../GameResultIcon';
import { GameSummary } from '../../../network/restClient';
import { formatTimeAgo } from '../../../utils/timeAgo';

const ROW_ICON_SIZE = 26;

interface GameRowProps {
  game: GameSummary;
}

function subtitleFor(game: GameSummary): string {
  const timeAgo = formatTimeAgo(game.endedAt ?? game.createdAt);
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
        </Text>
        <Text style={styles.subtitle}>{subtitleFor(game)}</Text>
      </View>
      {game.result && (
        <GameResultIcon result={game.result} size={ROW_ICON_SIZE} />
      )}
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
  subtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});
