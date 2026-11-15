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
  // The side reviewed, its figures set off.
  side: Color;
}

// The two players' columns, and the marks' between them.
const COLUMN_WIDTH = 88;
const MIDDLE_WIDTH = 40;

// A review at a glance, a column for each player under their avatar:
// accuracy, how many of their moves fell in each class - its mark between
// the two - and the rating each played the game at.
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

  // A row: its label, then white's figure, the middle, and black's.
  const row = (
    label: string,
    cell: (column: (typeof columns)[number]) => React.ReactNode,
    middle: React.ReactNode = null,
    key?: string,
  ) => (
    <View key={key} style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.column}>{cell(columns[0])}</View>
      <View style={styles.middle}>{middle}</View>
      <View style={styles.column}>{cell(columns[1])}</View>
    </View>
  );

  // A figure in its box: white's light, black's dark, the side reviewed's
  // ringed.
  const box = (color: Color, value: string, testID: string) => (
    <View
      style={[
        styles.box,
        color === 'w' ? styles.boxWhite : styles.boxBlack,
        color === side && styles.boxReviewed,
      ]}
    >
      <Text
        style={[
          styles.boxText,
          color === 'w' ? styles.boxTextWhite : styles.boxTextBlack,
        ]}
        testID={testID}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <View style={styles.summary} testID="review-summary">
      {row('Players', ({ player }) => (
        <>
          <Text style={styles.name} numberOfLines={1}>
            {player.displayName}
          </Text>
          <Avatar
            name={player.displayName}
            color={player.avatarColor}
            size={44}
            square
          />
        </>
      ))}
      {row('Accuracy', ({ color, review }) =>
        box(color, review.accuracy.toFixed(1), `review-accuracy-${color}`),
      )}
      <View style={styles.table}>
        {MOVE_CLASSES.map((moveClass) =>
          row(
            MOVE_CLASS_NAMES[moveClass],
            ({ color, review }) => (
              <Text
                style={[styles.count, { color: colors.moveClass[moveClass] }]}
                testID={`review-count-${color}-${moveClass}`}
              >
                {review.counts[moveClass]}
              </Text>
            ),
            <MoveClassIcon moveClass={moveClass} size={22} />,
            moveClass,
          ),
        )}
      </View>
      {row('Game rating', ({ color, review }) =>
        box(color, String(review.rating), `review-rating-${color}`),
      )}
    </View>
  );
};

export default ReviewSummary;

const useStyles = makeStyles((t) => ({
  summary: {
    width: '100%',
    gap: t.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
  },
  label: {
    flex: 1,
    fontSize: t.fontSize.lg,
    color: t.colors.text,
  },
  column: {
    width: COLUMN_WIDTH,
    alignItems: 'center',
    gap: t.spacing.xs,
  },
  middle: {
    width: MIDDLE_WIDTH,
    alignItems: 'center',
  },
  name: {
    maxWidth: COLUMN_WIDTH,
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.text,
  },
  box: {
    minWidth: 72,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  boxWhite: {
    backgroundColor: t.colors.evalBar.white,
  },
  boxBlack: {
    backgroundColor: t.colors.evalBar.black,
  },
  boxReviewed: {
    borderColor: t.colors.accent,
  },
  boxText: {
    fontSize: t.fontSize.xxl,
    fontWeight: t.fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  boxTextWhite: {
    color: t.colors.evalBar.onWhite,
  },
  boxTextBlack: {
    color: t.colors.evalBar.onBlack,
  },
  table: {
    gap: t.spacing.xs,
  },
  count: {
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
}));
