import { Text, View } from 'react-native';

import { makeStyles } from '../../theme';

interface CountPillProps {
  count: number;
  testID?: string;
}

// A count in a small grey pill - beside a section's title, or a filter's
// choice.
const CountPill: React.FC<CountPillProps> = ({ count, testID }) => {
  const styles = useStyles();
  return (
    <View style={styles.pill}>
      <Text style={styles.count} testID={testID}>
        {count}
      </Text>
    </View>
  );
};

export default CountPill;

const useStyles = makeStyles((t) => ({
  pill: {
    paddingHorizontal: t.spacing.sm,
    paddingVertical: t.spacing.xxs,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.countPill,
  },
  count: {
    color: t.colors.textMuted,
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
}));
