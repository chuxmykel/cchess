import { View, Text, StyleSheet } from 'react-native';

import Avatar from '../../Avatar';
import GameTypeIcon from '../../GameTypeIcon';
import GameResultIcon from '../../GameResultIcon';
import { GameSummary } from '../../../network/restClient';
import { formatTimeAgo } from '../../../utils/timeAgo';

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
        <GameTypeIcon type={game.gameType} />
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
      {game.result && <GameResultIcon result={game.result} />}
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
    width: 24,
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
