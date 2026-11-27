import { Modal, Pressable, Text, View } from 'react-native';

import { BadgeMark } from '../BadgeIcon';
import Button from '../Button';
import Icon from '../Icon';
import { type Badge, badgeDescription, badgeLabel } from '../../domain/badges';
import { makeStyles, useTheme } from '../../theme';

interface EarnedBadgesCardProps {
  // The badges just earned - none for no card.
  badges: Badge[];
  onSeeAll: () => void;
  onClose: () => void;
}

// The badges a game earned you, in a card over the screen once you've left
// the game: each one's mark, name and what it's for, and See all badges. A
// tap outside, or ✕, puts it away - there's nothing to claim.
const EarnedBadgesCard: React.FC<EarnedBadgesCardProps> = ({
  badges,
  onSeeAll,
  onClose,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <Modal
      visible={badges.length > 0}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Close"
        testID="earned-badges-backdrop"
      >
        {badges.length > 0 && (
          // Taps on the card stay on it.
          <Pressable
            style={styles.card}
            onPress={() => {}}
            testID="earned-badges-card"
          >
            <Pressable
              style={styles.close}
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
              testID="earned-badges-close"
            >
              <Icon name="close" size={20} color={colors.textMuted} />
            </Pressable>
            <Text style={styles.title} testID="earned-badges-title">
              {badges.length === 1
                ? 'Badge earned'
                : `${badges.length} badges earned`}
            </Text>
            {badges.map((badge) => (
              <View
                key={badge.id}
                style={[styles.badge, badges.length === 1 && styles.single]}
                testID={`earned-badge-${badge.kind}`}
              >
                <BadgeMark badge={badge} size={badges.length === 1 ? 88 : 48} />
                <View style={badges.length > 1 && styles.badgeText}>
                  <Text
                    style={[
                      styles.label,
                      badges.length === 1 && styles.centred,
                    ]}
                  >
                    {badgeLabel(badge)}
                  </Text>
                  <Text
                    style={[
                      styles.description,
                      badges.length === 1 && styles.centred,
                    ]}
                  >
                    {badgeDescription(badge)}
                  </Text>
                </View>
              </View>
            ))}
            <Button
              label="See all badges"
              variant="text"
              onPress={onSeeAll}
              testID="earned-badges-see-all"
            />
          </Pressable>
        )}
      </Pressable>
    </Modal>
  );
};

export default EarnedBadgesCard;

const useStyles = makeStyles((t) => ({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: t.spacing.xl,
    backgroundColor: t.colors.scrim,
  },
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: t.spacing.md,
    padding: t.spacing.lg,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.background,
    ...t.elevation.lg,
    shadowColor: t.colors.shadow,
  },
  close: { position: 'absolute', top: t.spacing.md, right: t.spacing.md },
  title: { ...t.typography.title, color: t.colors.text, textAlign: 'center' },
  badge: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
  },
  single: { flexDirection: 'column', gap: t.spacing.sm },
  badgeText: { flex: 1 },
  label: { ...t.typography.heading, color: t.colors.text },
  description: { ...t.typography.body, color: t.colors.textMuted },
  centred: { textAlign: 'center' },
}));
