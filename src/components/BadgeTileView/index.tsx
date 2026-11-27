import { Pressable, Text, View } from 'react-native';

import { BadgeMark } from '../BadgeIcon';
import { type BadgeTile, badgeLabel } from '../../domain/badges';
import { makeStyles } from '../../theme';

// Three to a row on a phone, wide enough for the longest name in a line.
export const TILE_WIDTH = 92;

// One badge in a grid: its mark - faded until earned - its name, how many
// times when more than once, and a dot while one of yours waits to be
// claimed. A tap opens its card.
const BadgeTileView: React.FC<{
  tile: BadgeTile;
  // Yours: unclaimed ones are marked new.
  isOwn?: boolean;
  onPress: () => void;
  testID: string;
}> = ({ tile, isOwn = false, onPress, testID }) => {
  const styles = useStyles();
  const earned = tile.awards.length > 0;
  const isNew = isOwn && tile.awards.some((badge) => !badge.claimedAt);
  return (
    <Pressable
      style={styles.tile}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${badgeLabel(tile)}${
        tile.awards.length > 1 ? `, earned ${tile.awards.length} times` : ''
      }${earned ? '' : ', not earned yet'}`}
      testID={testID}
    >
      <View style={!earned && styles.unearned}>
        <BadgeMark badge={tile} size={48} />
        {tile.awards.length > 1 && (
          <View style={styles.count} testID={`${testID}-count`}>
            <Text style={styles.countText}>{tile.awards.length}</Text>
          </View>
        )}
        {isNew && <View style={styles.new} testID={`${testID}-new`} />}
      </View>
      <Text
        style={[styles.label, !earned && styles.unearnedLabel]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {badgeLabel(tile)}
      </Text>
    </Pressable>
  );
};

export default BadgeTileView;

const useStyles = makeStyles((t) => ({
  tile: {
    width: TILE_WIDTH,
    alignItems: 'center',
    gap: t.spacing.xxs,
  },
  unearned: { opacity: 0.3 },
  label: {
    ...t.typography.caption,
    color: t.colors.text,
    textAlign: 'center',
  },
  unearnedLabel: { color: t.colors.textMuted },
  count: {
    position: 'absolute',
    right: -6,
    bottom: -2,
    minWidth: 20,
    paddingHorizontal: t.spacing.xs,
    borderRadius: t.radius.xl,
    backgroundColor: t.colors.text,
    alignItems: 'center',
  },
  countText: {
    fontSize: t.fontSize.xs,
    fontWeight: t.fontWeight.bold,
    color: t.colors.background,
  },
  new: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: t.colors.background,
    backgroundColor: t.colors.danger,
  },
}));
