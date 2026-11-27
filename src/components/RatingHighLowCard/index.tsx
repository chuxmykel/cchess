import { StyleSheet, Text, View } from 'react-native';
import { format, parseISO } from 'date-fns';

import { RatingPoint } from '../../network/restClient';
import { makeStyles } from '../../theme';

interface RatingHighLowCardProps {
  highest: RatingPoint | null;
  lowest: RatingPoint | null;
  /** Said where there's no point: no rated games, say. */
  emptyLabel?: string;
}

const HighLow: React.FC<{
  label: string;
  point: RatingPoint | null;
  emptyLabel: string;
  testID: string;
}> = ({ label, point, emptyLabel, testID }) => {
  const styles = useStyles();
  return (
    <View style={styles.half} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.rating}>{point ? point.rating : '—'}</Text>
      <Text style={styles.date}>
        {point ? format(parseISO(point.at), 'MMM d, yyyy') : emptyLabel}
      </Text>
    </View>
  );
};

/** The highest and lowest the rating went over a period, and when. */
const RatingHighLowCard: React.FC<RatingHighLowCardProps> = ({
  highest,
  lowest,
  emptyLabel = 'No rated games',
}) => {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <HighLow
        label="Highest rating"
        point={highest}
        emptyLabel={emptyLabel}
        testID="rating-highest"
      />
      <View style={styles.divider} />
      <HighLow
        label="Lowest rating"
        point={lowest}
        emptyLabel={emptyLabel}
        testID="rating-lowest"
      />
    </View>
  );
};

export default RatingHighLowCard;

const useStyles = makeStyles((t) => ({
  card: {
    flexDirection: 'row',
    marginHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.lg,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
  },
  half: {
    flex: 1,
    alignItems: 'center',
    gap: t.spacing.xxs,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.separator,
  },
  label: {
    fontSize: t.fontSize.md,
    color: t.colors.textMuted,
  },
  rating: {
    color: t.colors.text,
    fontSize: t.fontSize.h2,
    fontWeight: t.fontWeight.bold,
  },
  date: {
    fontSize: t.fontSize.sm,
    color: t.colors.textMuted,
  },
}));
