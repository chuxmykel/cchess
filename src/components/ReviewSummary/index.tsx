import { Text, View } from 'react-native';
import { Color } from 'chess.js';

import Avatar from '../Avatar';
import MoveClassIcon, { MOVE_CLASS_NAMES } from '../MoveClassIcon';
import { MOVE_CLASSES, SideReview } from '../../domain/review/types';
import type { GameUserSummary } from '../../network/socketEvents';
import { makeStyles, useTheme } from '../../theme';

interface ReviewSummaryProps {
  white: { player: GameUserSummary; review: SideReview };
  black: { player: GameUserSummary; review: SideReview };
  // The side reviewed, its column set off.
  side: Color;
}

// A review at a glance: each player's accuracy, then how many of their
// moves fell in each class.
const ReviewSummary: React.FC<ReviewSummaryProps> = ({
  white,
  black,
  side,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const columns = [
    { color: 'w' as Color, ...white },
    { color: 'b' as Color, ...black },
  ];
  return (
    <View style={styles.summary} testID="review-summary">
      <View style={styles.players}>
        <Text style={styles.rowLabel}>Players</Text>
        {columns.map(({ color, player }) => (
          <View key={color} style={styles.column}>
            <Text style={styles.name} numberOfLines={1}>
              {player.displayName}
            </Text>
            <Avatar
              name={player.displayName}
              color={player.avatarColor}
              size={44}
              square
            />
          </View>
        ))}
      </View>
      <View style={styles.players}>
        <Text style={styles.rowLabel}>Accuracy</Text>
        {columns.map(({ color, review }) => (
          <View key={color} style={styles.column}>
            <View
              style={[
                styles.accuracy,
                color === 'w' ? styles.accuracyWhite : styles.accuracyBlack,
                color === side && styles.accuracyReviewed,
              ]}
            >
              <Text
                style={[
                  styles.accuracyText,
                  color === 'w'
                    ? styles.accuracyTextWhite
                    : styles.accuracyTextBlack,
                ]}
                testID={`review-accuracy-${color}`}
              >
                {review.accuracy.toFixed(1)}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.table}>
        {MOVE_CLASSES.map((moveClass) => (
          <View key={moveClass} style={styles.classRow}>
            <Text style={styles.className}>{MOVE_CLASS_NAMES[moveClass]}</Text>
            <Text
              style={[styles.count, { color: colors.moveClass[moveClass] }]}
              testID={`review-count-w-${moveClass}`}
            >
              {white.review.counts[moveClass]}
            </Text>
            <View style={styles.icon}>
              <MoveClassIcon moveClass={moveClass} size={22} />
            </View>
            <Text
              style={[styles.count, { color: colors.moveClass[moveClass] }]}
              testID={`review-count-b-${moveClass}`}
            >
              {black.review.counts[moveClass]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default ReviewSummary;

const useStyles = makeStyles((t) => ({
  summary: {
    width: '100%',
    gap: t.spacing.md,
  },
  players: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: t.fontSize.md,
    color: t.colors.textMuted,
  },
  column: {
    width: 96,
    alignItems: 'center',
    gap: t.spacing.xs,
  },
  name: {
    maxWidth: 96,
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.text,
  },
  accuracy: {
    minWidth: 72,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accuracyWhite: {
    backgroundColor: t.colors.evalBar.white,
  },
  accuracyBlack: {
    backgroundColor: t.colors.evalBar.black,
  },
  accuracyReviewed: {
    borderColor: t.colors.accent,
  },
  accuracyText: {
    fontSize: t.fontSize.xxl,
    fontWeight: t.fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  accuracyTextWhite: {
    color: t.colors.evalBar.onWhite,
  },
  accuracyTextBlack: {
    color: t.colors.evalBar.onBlack,
  },
  table: {
    gap: t.spacing.xs,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
  },
  className: {
    flex: 1,
    fontSize: t.fontSize.lg,
    color: t.colors.text,
  },
  count: {
    width: 36,
    textAlign: 'center',
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  icon: {
    width: 24,
    alignItems: 'center',
  },
}));
