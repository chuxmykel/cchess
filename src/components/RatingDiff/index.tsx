import { Text } from 'react-native';
import { makeStyles } from '../../theme';

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

const RatingDiff: React.FC<RatingDiffProps> = ({ diff, testID }) => {
  const styles = useStyles();
  return (
    <Text
      style={[styles.diff, diff > 0 && styles.gain, diff < 0 && styles.loss]}
      testID={testID}
    >
      {formatDiff(diff)}
    </Text>
  );
};

export default RatingDiff;

const useStyles = makeStyles((t) => ({
  diff: {
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.ratingEven,
  },
  gain: {
    color: t.colors.ratingUp,
  },
  loss: {
    color: t.colors.ratingDown,
  },
}));
