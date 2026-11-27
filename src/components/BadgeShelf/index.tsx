import { Text, View } from 'react-native';

import BadgeTileView from '../BadgeTileView';
import { type Badge, type BadgeTile, earnedTiles } from '../../domain/badges';
import { makeStyles } from '../../theme';

// The most a profile's shelf shows; View All has the rest.
export const SHELF_SHOWN = 8;

interface BadgeShelfProps {
  badges: Badge[];
  isOwn: boolean;
  onOpen: (tile: BadgeTile) => void;
  // Said when there's nothing yet - on your own profile.
  emptyMessage?: string;
}

// A player's earned badges at a glance, as a grid: the game badges earned
// most first, then milestones, the newest first.
const BadgeShelf: React.FC<BadgeShelfProps> = ({
  badges,
  isOwn,
  onOpen,
  emptyMessage,
}) => {
  const styles = useStyles();
  const tiles = earnedTiles(badges).slice(0, SHELF_SHOWN);
  if (tiles.length === 0) {
    return emptyMessage ? (
      <View style={styles.shelf} testID="badge-shelf">
        <Text style={styles.empty} testID="badge-shelf-empty">
          {emptyMessage}
        </Text>
      </View>
    ) : null;
  }
  return (
    <View style={styles.shelf} testID="badge-shelf">
      {tiles.map((tile) => (
        <BadgeTileView
          key={tile.key}
          tile={tile}
          isOwn={isOwn}
          onPress={() => onOpen(tile)}
          testID={`badge-shelf-${tile.key.replace(/:+$/, '').replace(/:+/g, '-')}`}
        />
      ))}
    </View>
  );
};

export default BadgeShelf;

const useStyles = makeStyles((t) => ({
  shelf: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: t.spacing.md,
    marginHorizontal: t.spacing.lg,
    padding: t.spacing.lg,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
  },
  empty: { ...t.typography.body, color: t.colors.textMuted },
}));
