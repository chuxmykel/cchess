import { ScrollView, Text, View } from 'react-native';

import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { useBlockedPlayers } from '../../hooks/useBlockedPlayers';
import { makeStyles } from '../../theme';

/** The players you've blocked, the latest first, each to unblock. */
const BlockedPlayers: React.FC = () => {
  const styles = useStyles();
  const { players, error, unblock } = useBlockedPlayers();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID="blocked-players-screen"
    >
      {error && (
        <Text style={styles.error} testID="blocked-players-error">
          {error}
        </Text>
      )}
      {players?.length === 0 && (
        <EmptyState
          illustration="friends"
          title="Nobody blocked"
          message="Players you block, from their profile or a message, show up here."
          testID="blocked-players-empty"
        />
      )}
      {players?.map((player) => (
        <View
          key={player.id}
          style={styles.row}
          testID={`blocked-player-${player.username}`}
        >
          <Avatar
            name={player.displayName}
            color={player.avatarColor}
            size={40}
          />
          <View style={styles.names}>
            <Text style={styles.name}>{player.displayName}</Text>
            <Text style={styles.username}>@{player.username}</Text>
          </View>
          <Button
            label="Unblock"
            onPress={() => unblock(player)}
            variant="outline"
            testID={`unblock-${player.username}`}
          />
        </View>
      ))}
    </ScrollView>
  );
};

export default BlockedPlayers;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  content: {
    padding: t.spacing.lg,
    gap: t.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
  },
  names: {
    flex: 1,
  },
  name: {
    color: t.colors.text,
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.semibold,
  },
  username: {
    color: t.colors.textSecondary,
    fontSize: t.fontSize.md,
  },
  error: {
    color: t.colors.danger,
    fontSize: t.fontSize.base,
  },
}));
