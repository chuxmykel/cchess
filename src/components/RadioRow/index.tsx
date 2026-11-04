import { Pressable, Text, View } from 'react-native';

import Icon from '../Icon';
import { makeStyles, useTheme } from '../../theme';

export type RadioOption<Key extends string> = { key: Key; label: string };

interface RadioRowProps<Key extends string> {
  options: RadioOption<Key>[];
  selected: Key;
  onSelect: (key: Key) => void;
  // Each option's testID is this, then its key.
  testIDPrefix: string;
}

// One choice of a few, as radio buttons in a row, each labelled.
function RadioRow<Key extends string>({
  options,
  selected,
  onSelect,
  testIDPrefix,
}: RadioRowProps<Key>) {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {options.map(({ key, label }) => {
        const isSelected = key === selected;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            style={styles.option}
            hitSlop={6}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={label}
            testID={`${testIDPrefix}${key}`}
          >
            <Icon
              name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
              size={22}
              color={isSelected ? colors.accent : colors.textMuted}
            />
            <Text style={[styles.label, isSelected && styles.selectedLabel]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default RadioRow;

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: t.spacing.xl,
    rowGap: t.spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  label: {
    fontSize: t.fontSize.lg,
    color: t.colors.textSecondary,
  },
  selectedLabel: {
    color: t.colors.text,
    fontWeight: t.fontWeight.semibold,
  },
}));
