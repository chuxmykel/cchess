import { Text, View } from 'react-native';

import BadgeIcon from '../BadgeIcon';
import {
  BADGE_DESCRIPTIONS,
  BADGE_KINDS,
  BADGE_LABELS,
} from '../../domain/review/badges';
import type { BadgeCounts } from '../../domain/review/patterns';
import { makeStyles } from '../../theme';

interface BadgeShelfProps {
  badges: BadgeCounts;
  // Your own shelf shows the badges still to earn, faded; anyone else's
  // only those earned.
  showUnearned?: boolean;
}

// The badges a player's reviewed games have earned, each with how many
// times - a comeback, a swindle, a clean game.
const BadgeShelf: React.FC<BadgeShelfProps> = ({
  badges,
  showUnearned = false,
}) => {
  const styles = useStyles();
  const kinds = BADGE_KINDS.filter(
    (kind) => showUnearned || (badges[kind] ?? 0) > 0,
  );
  if (kinds.length === 0) return null;
  return (
    <View style={styles.shelf} testID="badge-shelf">
      {kinds.map((kind) => {
        const count = badges[kind] ?? 0;
        return (
          <View
            key={kind}
            style={[styles.badge, count === 0 && styles.unearned]}
            accessibilityLabel={`${BADGE_LABELS[kind]}: ${BADGE_DESCRIPTIONS[kind]}`}
            testID={`badge-shelf-${kind}`}
          >
            <BadgeIcon kind={kind} size={40} />
            <Text style={styles.label} numberOfLines={2}>
              {BADGE_LABELS[kind]}
            </Text>
            <Text style={styles.count} testID={`badge-shelf-${kind}-count`}>
              {count === 0 ? '-' : `×${count}`}
            </Text>
          </View>
        );
      })}
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
  badge: { width: 72, alignItems: 'center', gap: t.spacing.xxs },
  unearned: { opacity: 0.3 },
  label: {
    ...t.typography.caption,
    color: t.colors.text,
    textAlign: 'center',
  },
  count: { ...t.typography.caption, color: t.colors.textMuted },
}));
