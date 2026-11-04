import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

import Icon from '../Icon';
import NotchedSlider from '../NotchedSlider';
import { RatingRange } from '../../network/socketEvents';
import {
  MAX_RATING_RANGE_DELTA,
  RATING_RANGE_STEP,
} from '../../constants/seek';
import { makeStyles, useTheme } from '../../theme';

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
  const styles = useStyles();
  const { colors } = useTheme();

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
              <NotchedSlider
                style={styles.slider}
                minimumValue={0}
                maximumValue={MAX_RATING_RANGE_DELTA}
                step={RATING_RANGE_STEP}
                value={range[side] ?? lastLimits[side]}
                onValueChange={(limit) => setLimit(side, limit)}
                disabled={isOpen}
                minimumTrackTintColor={isOpen ? colors.disabled : colors.accent}
                maximumTrackTintColor={colors.border}
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
                  color={isOpen ? colors.accent : colors.textMuted}
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

const useStyles = makeStyles((t) => ({
  container: {
    gap: t.spacing.lg,
  },
  row: {
    gap: t.spacing.xs,
  },
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    fontSize: t.fontSize.lg,
    color: t.colors.text,
  },
  value: {
    fontSize: t.fontSize.xl,
    fontWeight: t.fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
  openValue: {
    color: t.colors.textMuted,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
  },
  slider: {
    flex: 1,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
  },
  checkboxLabel: {
    fontSize: t.fontSize.md,
    color: t.colors.textSecondary,
  },
}));
