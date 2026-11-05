import { Text, View } from 'react-native';

import Icon from '../Icon';
import { makeStyles, useTheme } from '../../theme';

interface RatingChangeProps {
  /** Points gained, or lost below zero. */
  change: number;
  testID?: string;
}

/** A green ▲ and the points gained, or a red ▼ and the points lost, in
 * italics. */
const RatingChange: React.FC<RatingChangeProps> = ({ change, testID }) => {
  const styles = useStyles();
  const { colors } = useTheme();

  if (change === 0) {
    return (
      <Text
        style={[styles.points, styles.italic, styles.unchanged]}
        testID={testID}
      >
        ±0
      </Text>
    );
  }
  const gained = change > 0;
  const color = gained ? colors.ratingUp : colors.ratingDown;
  return (
    <View
      style={[styles.row, styles.italic]}
      testID={testID}
      accessibilityLabel={`${gained ? 'Up' : 'Down'} ${Math.abs(change)} points`}
    >
      <Icon
        name={gained ? 'arrow-up-bold' : 'arrow-down-bold'}
        size={18}
        color={color}
        testID={testID && `${testID}-arrow`}
      />
      <Text style={[styles.points, { color }]}>{Math.abs(change)}</Text>
    </View>
  );
};

export default RatingChange;

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Skewed rather than fontStyle: 'italic', which can't slant the icon
  // font's arrow.
  italic: {
    transform: [{ skewX: '-12deg' }],
  },
  points: {
    color: t.colors.text,
    fontSize: t.fontSize.xl,
    fontWeight: t.fontWeight.bold,
  },
  unchanged: {
    color: t.colors.textMuted,
  },
}));
