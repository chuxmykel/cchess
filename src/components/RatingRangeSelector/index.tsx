import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

import Icon from '../Icon';
import { ACCENT_COLOR, MUTED_COLOR } from '../../constants/colors';
import { RatingRange } from '../../network/socketEvents';
import {
  MAX_RATING_RANGE_DELTA,
  RATING_RANGE_STEP,
} from '../../constants/seek';

type RangeSide = keyof RatingRange;

const SIDES: { side: RangeSide; label: string; sign: string }[] = [
  { side: 'below', label: 'Below my rating', sign: '−' },
  { side: 'above', label: 'Above my rating', sign: '+' },
];

interface RatingRangeSelectorProps {
  range: RatingRange;
  onChange: (range: RatingRange) => void;
}

const RatingRangeSelector: React.FC<RatingRangeSelectorProps> = ({
  range,
  onChange,
}) => {
  const [lastLimits, setLastLimits] = useState({
    below: range.below ?? MAX_RATING_RANGE_DELTA,
    above: range.above ?? MAX_RATING_RANGE_DELTA,
  });

  function setLimit(side: RangeSide, limit: number) {
    setLastLimits((previous) => ({ ...previous, [side]: limit }));
    onChange({ ...range, [side]: limit });
  }

  function toggleOpen(side: RangeSide) {
    onChange({
      ...range,
      [side]: range[side] === null ? lastLimits[side] : null,
    });
  }

  return (
    <View style={styles.container}>
      {SIDES.map(({ side, label, sign }) => {
        const isOpen = range[side] === null;
        return (
          <View key={side} style={styles.row}>
            <View style={styles.heading}>
              <Text style={styles.label}>{label}</Text>
              <Text
                style={[styles.value, isOpen && styles.openValue]}
                testID={`rating-range-${side}`}
              >
                {`${sign}${isOpen ? '∞' : range[side]}`}
              </Text>
            </View>
            <View style={styles.controls}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={MAX_RATING_RANGE_DELTA}
                step={RATING_RANGE_STEP}
                value={range[side] ?? lastLimits[side]}
                onValueChange={(limit) => setLimit(side, limit)}
                disabled={isOpen}
                minimumTrackTintColor={isOpen ? '#ccc' : ACCENT_COLOR}
                maximumTrackTintColor="#ddd"
                accessibilityLabel={label}
                testID={`rating-range-${side}-slider`}
              />
              <Pressable
                onPress={() => toggleOpen(side)}
                style={styles.checkbox}
                hitSlop={8}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isOpen }}
                accessibilityLabel={`Open ${label.toLowerCase()}`}
                testID={`rating-range-${side}-open`}
              >
                <Icon
                  name={isOpen ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={22}
                  color={isOpen ? ACCENT_COLOR : MUTED_COLOR}
                />
                <Text style={styles.checkboxLabel}>Open</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default RatingRangeSelector;

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  row: {
    gap: 4,
  },
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    fontSize: 15,
    color: '#333',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  openValue: {
    color: MUTED_COLOR,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slider: {
    flex: 1,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#555',
  },
});
