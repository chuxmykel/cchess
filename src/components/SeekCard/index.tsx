import { View, Text } from 'react-native';

import { TimeControl } from '../../constants/timeControls';
import { LobbyStats } from '../../network/socketEvents';
import GameTypeIcon from '../GameTypeIcon';
import { makeStyles } from '../../theme';

function countOf(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

interface SeekCardProps {
  timeControl: TimeControl;
  status?: string;
  ratingRange?: string;
  lobbyStats?: LobbyStats | null;
}

const SeekCard: React.FC<SeekCardProps> = ({
  timeControl,
  status = 'Waiting for opponent to join…',
  ratingRange,
  lobbyStats,
}) => {
  const styles = useStyles();
  return (
    <View style={styles.card} testID="seek-card">
      <Text style={styles.status}>{status}</Text>
      <View style={styles.timeControl}>
        <GameTypeIcon type={timeControl.type} size={20} />
        <Text style={styles.timeControlLabel}>{timeControl.label}</Text>
      </View>
      {ratingRange && (
        <Text style={styles.detail} testID="seek-card-rating-range">
          {ratingRange}
        </Text>
      )}
      {lobbyStats && (
        <View style={styles.lobbyStats} testID="seek-card-lobby-stats">
          <Text style={styles.detail}>
            {countOf(
              lobbyStats.playersOnline,
              'player online',
              'players online',
            )}
          </Text>
          <Text style={styles.detail}>
            {countOf(lobbyStats.gamesInPlay, 'game in play', 'games in play')}
          </Text>
        </View>
      )}
    </View>
  );
};

export default SeekCard;

const useStyles = makeStyles((t) => ({
  card: {
    minWidth: 200,
    paddingVertical: t.spacing.xl,
    paddingHorizontal: t.spacing.xl,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surfaceTranslucent,
    alignItems: 'center',
    gap: t.spacing.sm,
    ...t.elevation.md,
    shadowColor: t.colors.shadow,
  },
  status: {
    fontSize: t.fontSize.base,
    color: t.colors.textSecondary,
  },
  timeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    marginTop: t.spacing.xs,
  },
  timeControlLabel: {
    fontSize: t.fontSize.h2,
    fontWeight: t.fontWeight.bold,
  },
  lobbyStats: {
    alignItems: 'center',
    marginTop: t.spacing.xs,
  },
  detail: {
    fontSize: t.fontSize.base,
    color: t.colors.textSecondary,
  },
}));
