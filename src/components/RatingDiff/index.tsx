import { Text, StyleSheet } from 'react-native';

interface RatingDiffProps {
  diff: number;
  testID?: string;
}

const MINUS_SIGN = '−';

function formatDiff(diff: number): string {
  if (diff > 0) return `+${diff}`;
  if (diff < 0) return `${MINUS_SIGN}${Math.abs(diff)}`;
  return '±0';
}

const RatingDiff: React.FC<RatingDiffProps> = ({ diff, testID }) => (
  <Text
    style={[styles.diff, diff > 0 && styles.gain, diff < 0 && styles.loss]}
    testID={testID}
  >
    {formatDiff(diff)}
  </Text>
);

export default RatingDiff;

const styles = StyleSheet.create({
  diff: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  gain: {
    color: '#4caf50',
  },
  loss: {
    color: '#e53935',
  },
});
