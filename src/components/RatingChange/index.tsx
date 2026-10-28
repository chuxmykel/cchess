import { StyleSheet, Text, View } from 'react-native';

import Icon from '../Icon';
import { MUTED_COLOR } from '../../constants/colors';

interface RatingChangeProps {
  /** Points gained, or lost below zero. */
  change: number;
  testID?: string;
}

const GAIN_COLOR = '#4caf50';
const LOSS_COLOR = '#e53935';

/** A green ▲ and the points gained, or a red ▼ and the points lost, in
 * italics. */
const RatingChange: React.FC<RatingChangeProps> = ({ change, testID }) => {
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
  const color = gained ? GAIN_COLOR : LOSS_COLOR;
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

const styles = StyleSheet.create({
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
    fontSize: 16,
    fontWeight: '700',
  },
  unchanged: {
    color: MUTED_COLOR,
  },
});
