import { StyleSheet, Text, View } from 'react-native';
import { format, parseISO } from 'date-fns';

import { MUTED_COLOR } from '../../constants/colors';
import { RatingPoint } from '../../network/restClient';

interface RatingHighLowCardProps {
  highest: RatingPoint | null;
  lowest: RatingPoint | null;
}

const HighLow: React.FC<{
  label: string;
  point: RatingPoint | null;
  testID: string;
}> = ({ label, point, testID }) => (
  <View style={styles.half} testID={testID}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.rating}>{point ? point.rating : '—'}</Text>
    <Text style={styles.date}>
      {point ? format(parseISO(point.at), 'MMM d, yyyy') : 'No rated games'}
    </Text>
  </View>
);

/** The highest and lowest the rating went over a period, and when. */
const RatingHighLowCard: React.FC<RatingHighLowCardProps> = ({
  highest,
  lowest,
}) => (
  <View style={styles.card}>
    <HighLow label="Highest rating" point={highest} testID="rating-highest" />
    <View style={styles.divider} />
    <HighLow label="Lowest rating" point={lowest} testID="rating-lowest" />
  </View>
);

export default RatingHighLowCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  half: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#c8c8c8',
  },
  label: {
    fontSize: 13,
    color: MUTED_COLOR,
  },
  rating: {
    fontSize: 22,
    fontWeight: '700',
  },
  date: {
    fontSize: 12,
    color: MUTED_COLOR,
  },
});
